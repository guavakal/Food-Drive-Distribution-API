const URL_FDD_SPREADSHEET = "https://docs.google.com/spreadsheets/d/1JdH9ImaxwLqDlo6rmrMoOlbp1xOAlGn_Itu3G7qmj7M/edit?usp=sharing";
const TAB_MASTER_LIST = "MASTER LIST";

function test() {
  // dummy up arguments for rapid testing of doGet
  let dummy = '{"parameter":{"cardid":"0205198700600","action":"lookup"},"parameters":{"cardid":["0205198700600"],"action":["lookup"]},"contextPath":"","contentLength":-1,"queryString":"action=lookup&cardid=0205198700600"}';
  let args = JSON.parse(dummy);
  let retval = doGet(args);
  log2("retval", retval);
}

function maybeIdNumber(arg) {
  // check that arg is reasonable for an IDNUMBER
  if (arg) {
    if (arg.length > 0) {
      if (arg.length < 20) {
        return 1;
      }
    }
  }
  return 0;
}

var formatDateShort = function(d) {
  
  // convert to local
  var localDate = d.toLocaleString("en-US", {timeZone: "America/New_York", day: "2-digit", month: "short"});
  return localDate;
  
};

function doGet(e) {
  let params = JSON.stringify(e);
  log2("doGet", params);
  
  let action = e.parameter.action; 
  log2("action", action);
  
  
  if (action.toUpperCase() == "LOOKUP") {
    let cardid = e.parameter.cardid;
    if (maybeIdNumber(cardid) == 0) {
        return HtmlService.createHtmlOutput("BAD CARDID");
    }
    log2("LOOKUP", cardid);
    
    //let ss = SpreadsheetApp.openByUrl(URL_FDD_SPREADSHEET);
    //SpreadsheetApp.setActiveSpreadsheet(ss);
    //let st = ss.getSheetByName(TAB_MASTER_LIST);
    //let data = st.getDataRange().getValues();
    
    let data = getValuesWithCache(URL_FDD_SPREADSHEET, TAB_MASTER_LIST, 1);

    // compute key column Indexes
    let statusIdx = -1;
    let idnumberIdx = -1;
    let locationIdx = -1;
    let dateIdx = -1;  // compute this column
    for (let j=0; j<data[0].length; j++) {
      // positioning for Status
      if (data[0][j].trim() == "Status") {
        statusIdx = j;
      }
      // positioning for location, sector, other, firstname, lastname
      if (data[0][j].trim() == "Location") {
        locationIdx = j;
      }
      // positioning for ID Number and Date Received
      if (data[0][j].trim() == "ID Number") {
        idnumberIdx = j;
      }
      // positioning for ID Number and Date Received
      if ( (data[0][j].trim() == "Date Received") && ((j < dateIdx) || (dateIdx == -1)) ) {
        dateIdx = j;
      }
    }
    
    let arrStatus = [];
    let arrLocation = [];
    let arrSector = [];
    let arrOther = [];
    let arrLastname = [];
    let arrFirstname = [];
    let arrDatereceived = [];
    log2("data.length", data.length); // time from LOOKUP to here is about 5 seconds
    for (let i=1; i<data.length; i++) {
      let idnumber = data[i][idnumberIdx].substring(1);
      if (idnumber == cardid) {
        log2("FOUND", idnumber); 
        if (statusIdx != -1) {
          arrStatus.push(data[i][statusIdx]);
        }
        if (locationIdx != -1) {
          arrLocation.push(data[i][locationIdx]);
          arrSector.push(data[i][locationIdx+1]);
          arrOther.push(data[i][locationIdx+2]);
          arrLastname.push(data[i][locationIdx+3]);
          arrFirstname.push(data[i][locationIdx+4]);
        }
        if (dateIdx != -1) {
          for (let j=dateIdx; j<data[i].length; j++) {
            let d = data[i][j];
            if (d) {
              if (d instanceof Date) {
                arrDatereceived.push(formatDateShort(d));
              } else if (d) {
                let dt = new Date(d);
                arrDatereceived.push(formatDateShort(dt));
              }
           }
          }
        }
      }
    }
    
    let content = {
      'idnumber': cardid,
      'status': arrStatus,
      'location': arrLocation,
      'sector': arrSector,
      'other': arrOther,
      'lastname': arrLastname,
      'firstname': arrFirstname,
      'datereceived': arrDatereceived
    }
    return ContentService.createTextOutput( JSON.stringify(content) ).setMimeType(ContentService.MimeType.JSON); 
  }


  // 
  // JSONDUMP
  //
  if (action.toUpperCase() == "JSONDUMP") {
    log2("JSONDUMP", "BEGIN");

    // do not use cached data for dump
    // let data = getValuesWithCache(URL_FDD_SPREADSHEET, TAB_MASTER_LIST, 1);

    let ss = SpreadsheetApp.openByUrl(URL_FDD_SPREADSHEET);
    SpreadsheetApp.setActiveSpreadsheet(ss);
    let st = ss.getSheetByName(TAB_MASTER_LIST);
    let data = st.getDataRange().getValues();
    
    return ContentService.createTextOutput( JSON.stringify(data) ).setMimeType(ContentService.MimeType.JSON); 
  }
  
  return HtmlService.createHtmlOutput("BAD ACTION");
}

