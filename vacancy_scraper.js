import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import { parse } from 'json2csv';

async function scrapeVacancies(url) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const data = [];
  $('table tbody tr').each((i, row) => {
    const rowData = [];
    $(row).find('td').each((j, cell) => {
      rowData.push($(cell).text().trim());
    });
    data.push(rowData);
  });

  return data;
}

async function main() {
    const externalData = await scrapeVacancies('https://www.nwk.co.za/NWKGroup/code/Vacancies_new.php');
    const internalData = await scrapeVacancies('https://www.nwk.co.za/NWKGroup/code/Vacancies_new.php?Aand=I');
  
    const combinedData = [
      ...externalData.map(row => ['External', ...row]), 
      ...internalData.map(row => ['Internal', ...row])
    ];
    
    // CSV Export
    const fields = ['Type', 'Heading 1', 'Heading 2', 'Heading 3'];
    const opts = { fields };
    const csv = parse(combinedData, opts);
    fs.writeFileSync('vacancies.csv', csv);
    
    console.log('Combined data exported to vacancies.csv');
  }
  
  main();
