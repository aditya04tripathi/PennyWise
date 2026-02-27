import 'package:csv/csv.dart' as csv_pkg;

const csv = CsvHelper();

class CsvHelper {
  const CsvHelper();

  String encode(List<List<dynamic>> data) {
    return csv_pkg.csv.encode(data);
  }

  List<List<dynamic>> decode(String csvString) {
    return csv_pkg.csv.decode(csvString);
  }
}
