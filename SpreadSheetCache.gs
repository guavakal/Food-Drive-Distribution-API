function testValuesWithCaching() {
  log2("testValuesWithCaching", "BEGIN");

  let sheet = URL_FDD_SPREADSHEET;
  let tab = TAB_MASTER_LIST;
  // let tab = "OLD CENSUS";
  let cached = getValuesWithCache(sheet, tab, 1);

  // get the raw data 
  let ss = SpreadsheetApp.openByUrl(sheet);
  SpreadsheetApp.setActiveSpreadsheet(ss);
  let st = ss.getSheetByName(tab);
  let rawdata = st.getDataRange().getValues();

  // JSON stringify the data regardless so dates are unified
  let dataStr = JSON.stringify(rawdata);
  let dataPar = JSON.parse(dataStr);
  rawdata = dataPar;
  
  // compare sizes
  if (cached.length != rawdata.length) {
    log3("MISMATCH number of rows", cached.length, rawdata.length);
    return;
  }
  for (let i=0; i<cached.length; i++) {
    for (let j=0; j<cached[i].length; j++) {
      if (rawdata[i].length !== cached[i].length) {
        log2("MISMATCH number of cells in row", i);
        return;
      }
    }
  }
  
  // compare values
  for (let i=0; i<cached.length; i++) {
    for (let j=0; j<cached[i].length; j++) {
      if (rawdata[i][j] !== cached[i][j]) {
        log3("MISMATCH in cell i,j", i, j);
        log2("cached", cached[i][j]);
        log2("rawdata", rawdata[i][j]);
        return;
      }
    }
  }
  
  log2("testValuesWithCaching", "TEST PASSED");
}

const CACHE_KEY = "solfdd-data";
const CACHE_CHUNK_SIZE = 500;
const CACHE_TOTAL_COUNT_SUFFIX = "-totalCount";
const CACHE_CHUNK_SIZE_SUFFIX = "-chunkSize";
const CACHE_CHUNK_SUFFIX = "-chunk-";
const CACHE_TTL = 900;   // 15 mins
// const CACHE_TTL = 1800;
// extra seconds to store the chunks so they dont disappear while we are assembling
const CACHE_TTL_EXTRA = 5;  
function getValuesWithCache(sheet, tab, cacheFlag) {
  if (cacheFlag != 1) {
    // 1 means use the cache, anything else return data as below
    let ss = SpreadsheetApp.openByUrl(sheet);
    SpreadsheetApp.setActiveSpreadsheet(ss);
    let st = ss.getSheetByName(tab);
    let data = st.getDataRange().getValues();
    return data;
  }
  
  log2("getValuesWithCaching", "BEGIN");
  let cache = new CacheService.getScriptCache();
  let cached = cache.get(CACHE_KEY);
  if (cached != null) {
    log2("getValuesWithCaching", "CACHE HIT");
    
    // reassemble chunks
    let totalCount = cache.get(CACHE_KEY + CACHE_TOTAL_COUNT_SUFFIX); 
    let chunkSize = cache.get(CACHE_KEY + CACHE_CHUNK_SIZE_SUFFIX); // get this from cache instead of constant on read
    let chunkCount = Math.floor(totalCount / CACHE_CHUNK_SIZE) + 1;
    let result = [];
    for (let i=0;i<chunkCount;i++) {
      let chunkKey = CACHE_KEY + CACHE_CHUNK_SUFFIX + i.toString();
      log2("CACHE GET", chunkKey);
      let chunk = cache.get(chunkKey);  
      result = result.concat(JSON.parse(chunk));
    }
    
    return result;
  }
  let ss = SpreadsheetApp.openByUrl(sheet);
  SpreadsheetApp.setActiveSpreadsheet(ss);
  let st = ss.getSheetByName(tab);
  log2("getValuesWithCaching", "getValues() API Call start");
  let data = st.getDataRange().getValues();
  log2("getValuesWithCaching", "getValues() API Call end");

  // break up into chunks and store
  let totalCount = data.length;
  let chunkCount = Math.floor(totalCount / CACHE_CHUNK_SIZE) + 1;
  log3("totalCount, chunks", totalCount, chunkCount);

  cache.put(CACHE_KEY + CACHE_TOTAL_COUNT_SUFFIX, totalCount, CACHE_TTL + CACHE_TTL_EXTRA); 
  cache.put(CACHE_KEY + CACHE_CHUNK_SIZE_SUFFIX, CACHE_CHUNK_SIZE, CACHE_TTL + CACHE_TTL_EXTRA); 
  for (let i=0;i<chunkCount;i++) {
    let chunk = [];
    if (i == (chunkCount - 1)) {
      // last chunk
      chunk = data.slice(i*CACHE_CHUNK_SIZE);
    } else {
      chunk = data.slice(i*CACHE_CHUNK_SIZE, (i+1)*CACHE_CHUNK_SIZE);
    }
    let chunkKey = CACHE_KEY + CACHE_CHUNK_SUFFIX + i.toString();
    log2("CACHE PUT", chunkKey);
    cache.put(chunkKey, JSON.stringify(chunk), CACHE_TTL + CACHE_TTL_EXTRA);
  }
  
  // cache.put(CACHE_KEY, JSON.stringify(data), CACHE_TTL); 
  cache.put(CACHE_KEY, "This data is chunked.", CACHE_TTL); 

  log2("getValuesWithCaching", "END");
  let dataStr = JSON.stringify(data);
  let dataPar = JSON.parse(dataStr);
  return dataPar;
}

