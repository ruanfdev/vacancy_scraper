import puppeteer from 'puppeteer';
import fs from 'fs';
import { parse } from 'json2csv'; 

async function scrapeVacancies(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' }); // Wait until network is idle

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const rowData = [];

      // Get vacancy type
      const vacancyType = window.location.href.includes('Aand=I') ? 'Internal' : 'External';
      rowData.push(vacancyType);

      // Get the rest of the columns
      const cells = Array.from(row.querySelectorAll('td'));
      rowData.push(...cells.map(cell => cell.textContent.trim()));

      return rowData;
    });
  });

  await browser.close();
  return data;
}

async function main() {
  const externalData = await scrapeVacancies('https://www.nwk.co.za/NWKGroup/code/Vacancies_new.php');
  const internalData = await scrapeVacancies('https://www.nwk.co.za/NWKGroup/code/Vacancies_new.php?Aand=I');

  const combinedData = [...externalData, ...internalData];

  // CSV Export
  const fields = ['Vacancy Type', 'Position', 'Closing Date', 'Apply']; 
  const opts = { fields };
  const csv = parse(combinedData, opts);
  fs.writeFileSync('vacancies.csv', csv);
  
  console.log('Combined data exported to vacancies.csv');
}

main();