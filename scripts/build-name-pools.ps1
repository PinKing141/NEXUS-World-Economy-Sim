param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$RequirementsPath = (Join-Path $Root "requirements\\data"),
  [int]$TopForenames = 36,
  [int]$TopSurnames = 48
)

$null = Add-Type -Language CSharp @"
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

public static class NexusNameDataBuilder
{
    private sealed class NameEntry
    {
        public string Name;
        public long Weight;
    }

    private sealed class BucketCollector
    {
        public readonly int Limit;
        public readonly HashSet<string> Seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        public readonly List<NameEntry> Entries = new List<NameEntry>();

        public BucketCollector(int limit)
        {
            Limit = limit;
        }

        public void TryAdd(string name, long weight)
        {
            if (Entries.Count >= Limit)
            {
                return;
            }

            if (!Seen.Add(name))
            {
                return;
            }

            Entries.Add(new NameEntry { Name = name, Weight = weight });
        }
    }

    private static readonly HashSet<string> FamilyFirstCountries = new HashSet<string>(
        new[] { "CN", "HK", "JP", "KP", "KR", "MN", "TW", "VN" },
        StringComparer.OrdinalIgnoreCase
    );

    private static readonly Dictionary<string, string> ValidCountries = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    private static readonly Dictionary<string, Dictionary<string, BucketCollector>> ForenameBuckets =
        new Dictionary<string, Dictionary<string, BucketCollector>>(StringComparer.OrdinalIgnoreCase);
    private static readonly Dictionary<string, BucketCollector> SurnameBuckets =
        new Dictionary<string, BucketCollector>(StringComparer.OrdinalIgnoreCase);

    public static int Build(string root, string requirementsPath, int topForenames, int topSurnames)
    {
        ValidCountries.Clear();
        ForenameBuckets.Clear();
        SurnameBuckets.Clear();

        string countryCodesPath = ResolveInputPath(requirementsPath, root, "country_codes.csv");
        string forenamesPath = ResolveInputPath(requirementsPath, root, "forenames.csv");
        string surnamesPath = ResolveInputPath(requirementsPath, root, "surnames.csv");
        string outputPath = Path.Combine(root, "src", "js", "app", "name-data.js");

        LoadCountryCodes(countryCodesPath);
        ProcessForenames(forenamesPath, topForenames);
        ProcessSurnames(surnamesPath, topSurnames);
        WriteOutput(outputPath);

        return ValidCountries.Keys.Count(code =>
        {
            Dictionary<string, BucketCollector> forename;
            BucketCollector surname;
            ForenameBuckets.TryGetValue(code, out forename);
            SurnameBuckets.TryGetValue(code, out surname);
            bool hasMale = forename != null && forename["M"].Entries.Count > 0;
            bool hasFemale = forename != null && forename["F"].Entries.Count > 0;
            bool hasSurname = surname != null && surname.Entries.Count > 0;
            return hasMale || hasFemale || hasSurname;
        });
    }

    private static string ResolveInputPath(string requirementsPath, string root, string fileName)
    {
        string normalizedRequirements = string.IsNullOrWhiteSpace(requirementsPath) ? string.Empty : requirementsPath;
        if (!string.IsNullOrWhiteSpace(normalizedRequirements))
        {
            string preferred = Path.Combine(normalizedRequirements, fileName);
            if (File.Exists(preferred))
            {
                return preferred;
            }
        }

        string fallback = Path.Combine(root, fileName);
        if (File.Exists(fallback))
        {
            return fallback;
        }

        throw new FileNotFoundException(
            "Missing required CSV '" + fileName + "'. Place it in '" +
            (string.IsNullOrWhiteSpace(normalizedRequirements) ? "(requirements not set)" : normalizedRequirements) +
            "' or '" + root + "'.",
            fileName);
    }

    private static void LoadCountryCodes(string path)
    {
        using (var reader = new StreamReader(path, Encoding.UTF8, true))
        {
            reader.ReadLine();
            string line;
            while ((line = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                int commaIndex = line.IndexOf(',');
                if (commaIndex <= 0)
                {
                    continue;
                }

                string code = line.Substring(0, commaIndex).Trim().ToUpperInvariant();
                string name = line.Substring(commaIndex + 1).Trim();
                if (!string.IsNullOrEmpty(code))
                {
                    ValidCountries[code] = name;
                }
            }
        }
    }

    private static void ProcessForenames(string path, int limit)
    {
        using (var reader = new StreamReader(path, Encoding.UTF8, true))
        {
            reader.ReadLine();
            string line;
            while ((line = reader.ReadLine()) != null)
            {
                string[] fields = SplitNameCsvLine(line);
                if (fields == null || fields.Length < 4)
                {
                    continue;
                }

                string name = NormalizeName(fields[0]);
                string gender = (fields[1] ?? string.Empty).Trim().ToUpperInvariant();
                string country = (fields[2] ?? string.Empty).Trim().ToUpperInvariant();
                long count;

                if ((gender != "M" && gender != "F") ||
                    string.IsNullOrEmpty(name) ||
                    !IsLatinReadable(name) ||
                    !ValidCountries.ContainsKey(country) ||
                    !long.TryParse((fields[3] ?? string.Empty).Trim(), out count) ||
                    count <= 0)
                {
                    continue;
                }

                GetForenameCollector(country, gender, limit).TryAdd(name, count);
            }
        }
    }

    private static void ProcessSurnames(string path, int limit)
    {
        using (var reader = new StreamReader(path, Encoding.UTF8, true))
        {
            reader.ReadLine();
            string line;
            while ((line = reader.ReadLine()) != null)
            {
                string[] fields = SplitNameCsvLine(line);
                if (fields == null || fields.Length < 4)
                {
                    continue;
                }

                string name = NormalizeName(fields[0]);
                string country = (fields[2] ?? string.Empty).Trim().ToUpperInvariant();
                long count;

                if (string.IsNullOrEmpty(name) ||
                    !IsLatinReadable(name) ||
                    !ValidCountries.ContainsKey(country) ||
                    !long.TryParse((fields[3] ?? string.Empty).Trim(), out count) ||
                    count <= 0)
                {
                    continue;
                }

                GetSurnameCollector(country, limit).TryAdd(name, count);
            }
        }
    }

    private static string[] SplitNameCsvLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return null;
        }

        int first = line.IndexOf(',');
        if (first < 0) return null;
        int second = line.IndexOf(',', first + 1);
        if (second < 0) return null;
        int third = line.IndexOf(',', second + 1);
        if (third < 0) return null;

        return new[]
        {
            line.Substring(0, first),
            line.Substring(first + 1, second - first - 1),
            line.Substring(second + 1, third - second - 1),
            line.Substring(third + 1)
        };
    }

    private static string NormalizeName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string normalized = string.Join(" ", value.Trim().Split((char[])null, StringSplitOptions.RemoveEmptyEntries));
        return normalized.Length == 0 ? null : normalized;
    }

    private static bool IsLatinReadable(string value)
    {
        bool hasLetter = false;

        foreach (char ch in value)
        {
            if (char.IsLetter(ch))
            {
                int code = ch;
                bool isLatin =
                    (code >= 0x0041 && code <= 0x005A) ||
                    (code >= 0x0061 && code <= 0x007A) ||
                    (code >= 0x00C0 && code <= 0x024F) ||
                    (code >= 0x1E00 && code <= 0x1EFF);

                if (!isLatin)
                {
                    return false;
                }

                hasLetter = true;
                continue;
            }

            if (ch == '\'' || ch == '-' || ch == '.' || ch == ' ')
            {
                continue;
            }

            return false;
        }

        return hasLetter;
    }

    private static BucketCollector GetForenameCollector(string country, string gender, int limit)
    {
        Dictionary<string, BucketCollector> countryBuckets;
        if (!ForenameBuckets.TryGetValue(country, out countryBuckets))
        {
            countryBuckets = new Dictionary<string, BucketCollector>(StringComparer.OrdinalIgnoreCase)
            {
                { "M", new BucketCollector(limit) },
                { "F", new BucketCollector(limit) }
            };
            ForenameBuckets[country] = countryBuckets;
        }

        return countryBuckets[gender];
    }

    private static BucketCollector GetSurnameCollector(string country, int limit)
    {
        BucketCollector bucket;
        if (!SurnameBuckets.TryGetValue(country, out bucket))
        {
            bucket = new BucketCollector(limit);
            SurnameBuckets[country] = bucket;
        }

        return bucket;
    }

    private static void WriteOutput(string outputPath)
    {
        var sb = new StringBuilder(512 * 1024);
        sb.Append("window.NexusNameData = {");
        sb.Append("\"NAME_ORDER_COUNTRIES\":[");
        sb.Append(string.Join(",", FamilyFirstCountries.OrderBy(code => code).Select(code => Quote(code))));
        sb.Append("],\"NAME_POOLS\":{");

        bool firstCountry = true;

        foreach (string code in ValidCountries.Keys.OrderBy(code => code, StringComparer.OrdinalIgnoreCase))
        {
            Dictionary<string, BucketCollector> forename;
            BucketCollector surname;
            ForenameBuckets.TryGetValue(code, out forename);
            SurnameBuckets.TryGetValue(code, out surname);

            List<NameEntry> male = forename != null ? forename["M"].Entries : new List<NameEntry>();
            List<NameEntry> female = forename != null ? forename["F"].Entries : new List<NameEntry>();
            List<NameEntry> surnames = surname != null ? surname.Entries : new List<NameEntry>();

            if (male.Count == 0 && female.Count == 0 && surnames.Count == 0)
            {
                continue;
            }

            if (!firstCountry)
            {
                sb.Append(",");
            }
            firstCountry = false;

            sb.Append(Quote(code));
            sb.Append(":{");
            sb.Append("\"countryName\":").Append(Quote(ValidCountries[code])).Append(",");
            sb.Append("\"displayOrder\":").Append(Quote(FamilyFirstCountries.Contains(code) ? "familyFirst" : "givenFirst")).Append(",");
            sb.Append("\"male\":").Append(FormatEntries(male)).Append(",");
            sb.Append("\"female\":").Append(FormatEntries(female)).Append(",");
            sb.Append("\"surnames\":").Append(FormatEntries(surnames));
            sb.Append("}");
        }

        sb.Append("}};");
        File.WriteAllText(outputPath, sb.ToString(), new UTF8Encoding(false));
    }

    private static string FormatEntries(List<NameEntry> entries)
    {
        if (entries == null || entries.Count == 0)
        {
            return "[]";
        }

        var sb = new StringBuilder();
        sb.Append("[");
        for (int i = 0; i < entries.Count; i++)
        {
            if (i > 0)
            {
                sb.Append(",");
            }

            sb.Append("[");
            sb.Append(Quote(entries[i].Name));
            sb.Append(",");
            sb.Append(entries[i].Weight);
            sb.Append("]");
        }
        sb.Append("]");
        return sb.ToString();
    }

    private static string Quote(string value)
    {
        var sb = new StringBuilder(value.Length + 8);
        sb.Append("\"");

        foreach (char ch in value)
        {
            switch (ch)
            {
                case '\\':
                    sb.Append("\\\\");
                    break;
                case '\"':
                    sb.Append("\\\"");
                    break;
                case '\r':
                    sb.Append("\\r");
                    break;
                case '\n':
                    sb.Append("\\n");
                    break;
                case '\t':
                    sb.Append("\\t");
                    break;
                default:
                    if (char.IsControl(ch) || ch > 126)
                    {
                        sb.Append("\\u");
                        sb.Append(((int)ch).ToString("x4"));
                    }
                    else
                    {
                        sb.Append(ch);
                    }
                    break;
            }
        }

        sb.Append("\"");
        return sb.ToString();
    }
}
"@

$poolCount = [NexusNameDataBuilder]::Build($Root, $RequirementsPath, $TopForenames, $TopSurnames)
Write-Host ("Wrote {0} country pools to {1}" -f $poolCount, (Join-Path $Root "src\\js\\app\\name-data.js"))
