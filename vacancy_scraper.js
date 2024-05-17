import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeVacancies(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
      await page.waitForSelector('table:not(.table_title) tbody tr', { timeout: 5000 });

      const data = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table:not(.table_title) tbody tr'));

          return rows.slice(1).map(row => {
              const rowData = [];
              const vacancyType = window.location.href.includes('Aand=I') ? 'Internal' : 'External';
              rowData.push(vacancyType);

              const positionCell = row.querySelector('td:nth-child(1)');
              const closingDateCell = row.querySelector('td:nth-child(2)');

              // Extract position and location
              const position = positionCell.querySelector('a')?.textContent.trim() || '';
              const location = positionCell.textContent.trim().replace(position, '').match(/\(([^)]+)\)/)?.[1].trim() || '';

              rowData.push(position, location, closingDateCell.textContent.trim());

              return rowData;
          });
      });

      console.log('Scraped data:', data);
      return data;
    } catch (error) {
      console.error('Error scraping data:', error);
      await page.screenshot({ path: 'error_screenshot.png' });  // Take a screenshot for debugging
      throw error; 
    } finally {
      await browser.close();
  }
}

async function main() {
  const externalData = await scrapeVacancies('https://www.nwk.co.za/NWKGroup/code/Vacancies_new.php');
  const internalData = await scrapeVacancies('https://www.nwk.co.za/NWKGroup/code/Vacancies_new.php?Aand=I');

  const combinedData = [...externalData, ...internalData];

  // Remove duplicates based on position AND location
  const seenPositions = new Set();
  const deduplicatedData = combinedData.filter(row => {
    const positionLocationKey = `${row[1]}-${row[2]}`; // Create a unique key for position-location
    if (seenPositions.has(positionLocationKey)) {
      return false; // Is duplicate
    }

    seenPositions.add(positionLocationKey);

    // Combine vacancy types if both internal and external exist
    const externalExists = combinedData.some(
      r => r[1] === row[1] && r[2] === row[2] && r[0] === 'External'
    );
    const internalExists = combinedData.some(
      r => r[1] === row[1] && r[2] === row[2] && r[0] === 'Internal'
    );

    if (externalExists && internalExists) {
      row[0] = 'External & Internal';
    }

    return true; // Not duplicate
  });

  // CSV Export
  const fields = ['Vacancy Type', 'Position', 'Location', 'Closing Date'];

  try {
    // Create CSV string from combinedData, including the header
    const csv = [
      fields.join(','), // Add the header row
      ...deduplicatedData.map(row => row.join(','))
    ].join('\n');

    fs.writeFileSync('vacancies.csv', csv);

    console.log('Combined data exported to vacancies.csv');
  } catch (err) {
    console.error(err);
  }
}

main();