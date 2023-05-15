// import * as dotenv from './node_modules/dotenv'
// dotenv.config()

// **Set API constants

const rainforestKey = process.env.RAINFOREST_KEY;
const googleKey = process.env.GOOGLE_KEY;
const customSearch = process.env.googleCustomSearch;

const baseURL = `https://api.rainforestapi.com/request?`;
const amazon_domain = `amazon.com`;
const googleURL = `https://www.googleapis.com/customsearch/v1`

// **Set DOCUMENT element constants

const body = document.querySelector(`body`);
const mobilesearchbox = document.querySelector(`#mobilesearchbox`);
const searchButton = document.querySelector(`button`);
const container = document.querySelector(`.container`);
const form = document.querySelector(`form`);
const input = document.getElementsByClassName(`search`)[0];

const loader1 = document.getElementById(`loader1`);
const loader2 = document.getElementById(`loader2`);
const arrow1 = document.getElementById(`arrow1`);
const arrow2 = document.getElementById(`arrow2`);
const arrow3 = document.getElementById(`arrow3`);
const arrow4 = document.getElementById(`arrow4`);

const step1 = document.getElementById(`step1`);
const step2 = document.getElementById(`step2`);
const step3 = document.getElementById(`step3`);

const searchBox = document.getElementById(`searchBox`);
const amazonResults = document.getElementById(`amazonResultsBox`);
const googleResults = document.getElementById(`googleResultsBox`);

// ***returns Amazon search results for a given term filtered by small business***

async function amazonSearch(searchTerm) {

  // // ***RAINFOREST SEARCH API CALL TO GET AMAZON SEARCH RESULTS***

  try {
    const res = await fetch(`${baseURL}api_key=${rainforestKey}&type=search&amazon_domain=${amazon_domain}&search_term=${searchTerm}`);
    const json = await res.json();
    const searchResults = json.search_results;

    const smallBusinesses = [];

    for (const result of searchResults) {
      if (result.is_small_business === true) { smallBusinesses.push(result); }
    }

    if (smallBusinesses.length === 0) {
      const noBizCard = document.createElement(`div`);
      noBizCard.classList = newAmazonCard;
      noBizCard.textContent = `There are no small businesses selling ${searchTerm} on Amazon.`
      amazonResults.appendChild(noBizCard);

      const sbaLink = `https://www.sba.gov/business-guide/10-steps-start-your-business`
      const a = document.createElement(`a`);
      a.href = sbaLink;
      a.setAttribute(`target`, `_blank`);
      a.textContent = `Maybe you could start one!`
      noBizCard.appendChild(a);
    }
    else {
      for (const result of smallBusinesses) { createAmazonCard(result, searchTerm) }
    }
  }
  catch {
    alert(`There are no small businesses selling ${searchTerm} on Amazon. Perhaps you could start one?`);
  }
  return false;
}

///***FUNCTION TO CREATE THE AMAZON RESULT CARDS
function createAmazonCard(result, searchTerm) {
  const asin = result.asin;
  const image = result.image;
  const link = result.link;
  const title = result.title;
  const price = result.price.raw;
  const rating = result.rating;
  const ratings_total = result.ratings_total;

  const newAmazonCard = document.createElement(`div`);
  newAmazonCard.classList.add(`amazoncard`)
  amazonResults.appendChild(newAmazonCard);

  const img = document.createElement(`img`);
  img.classList.add(`image`);
  img.src = image;
  newAmazonCard.appendChild(img);

  const titleSection = document.createElement('p');
  titleSection.classList.add('title', `content`)
  titleSection.textContent = title;
  newAmazonCard.appendChild(titleSection);

  const additionalInfo = document.createElement(`p`);
  additionalInfo.classList.add(`content`);
  additionalInfo.textContent = `${price} | ${rating} star rating (${ratings_total})`;
  newAmazonCard.appendChild(additionalInfo);

  const buttonBox = document.createElement(`p`);
  buttonBox.classList.add(`buttonBox`, `content`);
  newAmazonCard.appendChild(buttonBox);

  const amazonButton = document.createElement(`button`);
  amazonButton.textContent = `Buy on Amazon`;
  amazonButton.style.color = `gray`;
  buttonBox.appendChild(amazonButton);

  const googleButton = document.createElement(`button`);
  googleButton.textContent = `BUYPASS Amazon`;
  googleButton.style.textWeight = `bold`;
  googleButton.style.backgroundColor = 'blue';
  googleButton.style.color = "white";
  buttonBox.appendChild(googleButton);

  amazonButton.addEventListener(`click`, () => {
    buttonClick(amazonButton);
    window.open(link)
  });

  googleButton.addEventListener(`click`, async () => {

    buttonClick(googleButton);
    window.scrollTo(0, 0);
    addMobileSearch();

    let isWaiting = true;

    step1.classList.add(`padinactive`);
    searchBox.classList.add(`padinactive`);
    step2.classList.add(`mobileinactive`);
    amazonResults.classList.add(`mobileinactive`);
    step3.classList.remove(`mobileinactive`);
    step3.classList.remove(`padinactive`);
    googleResults.classList.remove(`mobileinactive`);
    googleResults.classList.remove(`padinactive`)

    while (isWaiting === true) {
      startLoading(loader2);
      isWaiting = await productSearch(asin, searchTerm);
    }
    endLoading(loader2);
  });
}

async function productSearch(asin, searchTerm) {
  try {
    const res = await fetch(`${baseURL}api_key=${rainforestKey}&type=product&amazon_domain=${amazon_domain}&asin=${asin}`);
    const productObject = await res.json();

    const brandName = productObject.product.brand;
    googleSearch(brandName, searchTerm)
  }
  catch {
    alert(`Error`);
  }
}

//***Google search function */

async function googleSearch(brandName, searchTerm) {

  const lowBrandName = brandName.toLowerCase();
  const lowSearchTerm = searchTerm.toLowerCase();
  let fullSearch = ``;

  if (lowBrandName.includes(lowSearchTerm) && (lowBrandName.includes(`company`) || lowBrandName.includes(`co.`))) { fullSearch = brandName; }
  if (lowBrandName.includes(lowSearchTerm) && !(lowBrandName.includes(`company`) || lowBrandName.includes(`.co`))) { fullSearch = `${brandName} + company`; }
  if (!lowBrandName.includes(lowSearchTerm) && (lowBrandName.includes(`company`) || lowBrandName.includes(`co.`))) { fullSearch = `${brandName} + ${searchTerm}` }
  if (!lowBrandName.includes(lowSearchTerm) && !(lowBrandName.includes(`company`) || lowBrandName.includes(`.co`))) { fullSearch = `${brandName} + ${searchTerm} + company` };

  const enFullSearch = encodeURIComponent(fullSearch);

  try {
    const res = await fetch(`${googleURL}?q=${enFullSearch}&cx=${customSearch}&key=${googleKey}&num=10`)
    const results = await res.json();

    const brandSearchResult = results.items;

    const exlArr = [`amazon`, `walmart`, `kmart`, `target`, `walgreens`, `cvs`, `samsclub`, `costco`, `ebay`, 'rei'];
    let exclude = true;

    while (exclude === true) {
      if (exlArr.some(element => brandSearchResult[0].formattedUrl.includes(element))) { brandSearchResult.shift() }
      else exclude = false;
    }

    createGoogleCard(brandSearchResult[0], brandName);
  }
  catch {
    alert(`Error`);
  }
}

//***FUNCTION TO CREATE THE GOOGLE RESULT CARDS */

function createGoogleCard(result, brandName) {

  const link = result.formattedUrl;
  const snippet = result.snippet;
  const title = result.title;

  const newGoogleCard = document.createElement(`div`);
  newGoogleCard.classList.add(`googlecard`)
  googleResults.appendChild(newGoogleCard);

  const titleSection = document.createElement('p');
  titleSection.classList.add('googletitle', `content`);
  titleSection.textContent = title;
  newGoogleCard.appendChild(titleSection);

  const snippetSection = document.createElement('p');
  snippetSection.classList.add('snippet', `content`)
  snippetSection.textContent = snippet;
  newGoogleCard.appendChild(snippetSection);

  const buttonBox = document.createElement(`p`);
  buttonBox.classList.add(`buttonBox`, `content`);
  newGoogleCard.appendChild(buttonBox);

  const googleButton = document.createElement(`button`);
  googleButton.textContent = `Go to ${brandName}`;
  googleButton.style.textWeight = `bold`;
  googleButton.style.backgroundColor = `forestgreen`;
  googleButton.style.color = `white`;
  buttonBox.appendChild(googleButton);

  googleButton.addEventListener(`click`, () => {
    buttonClick(googleButton);
    window.open(link)
  });
}

function addMobileSearch() {
  mobilesearchbox.innerHTML = "";
  const newForm = document.createElement(`form`);
  newForm.classList.add(`mobilesearch`);
  const newInput = document.createElement(`input`);
  newInput.classList.add(`search`);
  newInput.type = `text`;
  const newButton = document.createElement(`button`);
  newButton.classList.add(`unclicked`);

  newButton.textContent = `New Search`;

  mobilesearchbox.appendChild(newForm);
  newForm.appendChild(newInput);
  newForm.appendChild(newButton);

  newForm.addEventListener(`submit`, async (e) => {

    e.preventDefault();
    buttonClick(newButton);
    let searchTerm = newInput.value;
    let isWaiting = true;

    step3.classList.add(`mobileinactive`);
    googleResults.classList.add(`mobileinactive`);
    step2.classList.remove(`mobileinactive`);
    amazonResults.classList.remove(`mobileinactive`);

    amazonResults.innerHTML = "";
    googleResults.innerHTML = "";

    while (isWaiting === true) {
      startLoading(loader1);
      isWaiting = await amazonSearch(searchTerm);
    }
    endLoading(loader1);
  })
}

function buttonClick(button) {
  button.classList.toggle(`clicked`);
  setTimeout(function () { button.classList.toggle(`clicked`) }, 300);
}

//***SEARCH BOX AND FUNCTION CALLS***

form.addEventListener(`submit`, async (e) => {

  e.preventDefault();
  buttonClick(searchButton);
  let searchTerm = input.value;
  let isWaiting = true;

  step1.classList.add(`mobileinactive`);
  searchBox.classList.add(`mobileinactive`);
  step2.classList.remove(`mobileinactive`);
  amazonResults.classList.remove(`mobileinactive`);

  amazonResults.innerHTML = "";
  googleResults.innerHTML = "";

  while (isWaiting === true) {
    startLoading(loader1);
    isWaiting = await amazonSearch(searchTerm);
  }
  endLoading(loader1);
})

function startLoading(loader) {
  loader.classList.remove(`inactive`);
  loader.style.display = "flex";
  arrow1.classList.remove('inactive');
  arrow2.classList.remove('inactive');
  arrow3.classList.remove('inactive');
  arrow4.classList.remove('inactive');
}

function endLoading(loader) {
  loader.classList.add(`inactive`);
  loader.style.display = "none";
  arrow1.classList.add('inactive');
  arrow2.classList.add('inactive');
  arrow3.classList.add('inactive');
  arrow4.classList.add('inactive');
}