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
    
    // Add Vacancy Type as the first column
    const vacancyType = url.includes('Aand=I') ? 'Internal' : 'External'; 
    rowData.push(vacancyType); 

    // Extract all existing cells
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
    ...externalData, 
    ...internalData 
  ];

  // CSV Export (adjust the field names to your columns)
  const fields = ['Vacancy Type', 'Position', 'Closing Date', 'Apply']; 
  const opts = { fields };
  const csv = parse(combinedData, opts);
  fs.writeFileSync('vacancies.csv', csv);
  
  console.log('Combined data exported to vacancies.csv');
}

main();
