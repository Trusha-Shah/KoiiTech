const puppeteer = require('puppeteer');
const { connectToMongoDB } = require('./mongoClient');

const collectionName = 'first_entry_record';

async function scrapeForumPosts(browser) {
  const page = await browser.newPage();

  try {
   
    await page.goto('https://forums.redflagdeals.com/hot-deals-f9/');


    await page.waitForSelector('#partition_forums > nav.forums_nav > div.forums_nav_primary_column > div.forums_nav_link.forums_nav_home > a');
    const button = await page.$('#partition_forums > nav.forums_nav > div.forums_nav_primary_column > div.forums_nav_link.forums_nav_home > a');
    if (button) {
      await button.click();
    }

    await page.waitForSelector('#partition_forums > div > div.primary_content > div.forum_content');

    await page.waitForFunction(() => {
      const titles = document.querySelectorAll('ul.forum_list > li > div > h2');
      return Array.from(titles).every(title => title.clientHeight > 0);
    });


    const forums = await page.evaluate(async () => {
      const forumContainers = document.querySelectorAll('#partition_forums > div > div.primary_content > div.forum_content');
      const forumList = [];

      for (const forumContainer of forumContainers) {
        const forumTitles = forumContainer.querySelectorAll('ul.forum_list > li > div > h2 > a');
        
        await Promise.all(Array.from(forumTitles).map(async (forumTitle) => {
          
          const title = forumTitle.textContent.trim();
          const link = forumTitle.href;

          forumList.push({ title, link });
        }));
      }

      return forumList;
    });

    return forums;
  } finally {
    await page.close();
  }
}

async function scrapeAndStoreDetails(forum, browser) {
  const newPage = await browser.newPage();
  
  try {
    await newPage.goto(forum.link, { waitUntil: 'domcontentloaded', timeout: 30000 });

   
    await newPage.waitForSelector('#partition_forums');

    const forumDetails = await newPage.evaluate(() => {
     
      const titleSelector1 = '#partition_forums > div > div.primary_content > div.forumbg.no_trending_topics > div > ul.topiclist.topics > li:nth-child(1) > div > div.thread_info > div.thread_info_main.postvoting_enabled > div > h3';
      const titleSelector2 = '#partition_forums > div > div.primary_content > div.forumbg > div > ul.topiclist.topics.with_categories > li.row.topic.sticky > div > div.thread_info > div.thread_info_main.postvoting_enabled > div > h3';
      const titleSelector3 = '#partition_forums > div > div.primary_content > div.forum_content > div > ul.forum_list > li:nth-child(1) > div';
      const title = document.querySelector(titleSelector1) || document.querySelector(titleSelector2) ||  document.querySelector(titleSelector3);
      return title ? title.textContent.trim() : null;
    });

    if (forumDetails) {
  
      const db = await connectToMongoDB();
      const collection = db.collection(collectionName);

      const existingForum = await collection.findOne({ forumTitle: forum.title });

      if (!existingForum) {
        await collection.insertOne({ forumTitle: forum.title, firstRecord: forumDetails });
        console.log(`Details for forum added: ${forum.title}`);
      } else {
        console.log(`Details for duplicate forum found: ${forum.title}`);
      }
    }
  } catch (error) {
    console.error(`Error while scraping forum details for ${forum.title}:`, error);
  } finally {
    await newPage.close();
  }
}

async function run() {
  const browser = await puppeteer.launch({ headless: false });

  try {
    const forums = await scrapeForumPosts(browser);

    for (const forum of forums) {
      await scrapeAndStoreDetails(forum, browser);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

run();
