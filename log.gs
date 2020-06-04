var LOG_WRITE_TO_SPREADSHEET = 0;

var logfn = function(fname) {
  Logger.log("begin function " + fname);
  if (LOG_WRITE_TO_SPREADSHEET != 1) {
    return;
  }
  log2("begin function", fname);
  return;
};

var log2 = function(l1, l2) {
  Logger.log(l1 + " : " + l2);
  if (LOG_WRITE_TO_SPREADSHEET != 1) {
    return;
  }
  let ss = SpreadsheetApp.openByUrl(DATA_URL);
  SpreadsheetApp.setActiveSpreadsheet(ss);
  let st = ss.getSheetByName("LOG");
  let ts = new Date();
  st.appendRow([ts, l1, l2]);
  return;
};

var log3 = function(l1, l2, l3) {
  Logger.log(l1 + " : " + l2 + " : " + l3);
  if (LOG_WRITE_TO_SPREADSHEET != 1) {
    return;
  }
  let ss = SpreadsheetApp.openByUrl(DATA_URL);
  SpreadsheetApp.setActiveSpreadsheet(ss);
  let st = ss.getSheetByName("LOG");
  let ts = new Date();
  st.appendRow([ts, l1, l2, l3]);
  return;
};