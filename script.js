// =======================
// 1. HTML ELEMENTS
// =======================

const pickBtn = document.getElementById("pickBtn");
const result = document.getElementById("result");
const classicMode = document.getElementById("classicMode");
const saveBtn = document.getElementById("saveBtn");
const favoritesList = document.getElementById("favoritesList");
const recentList = document.getElementById("recentList");
const sortRatingBtn = document.getElementById("sortRatingBtn");
const sortSeasonBtn = document.getElementById("sortSeasonBtn");
const huluBtn = document.getElementById("huluBtn");


// =======================
// 2. APP DATA
// =======================

const EPISODES_URL = "https://api.tvmaze.com/shows/347/episodes";
const HULU_URL = "https://www.hulu.com/series/its-always-sunny-in-philadelphia-2171423f-3326-4dfa-b193-b40494e60109";

let episodes = [];
let currentEpisode = null;

let favorites = JSON.parse(localStorage.getItem("sunnyFavorites")) || [];
let recentEpisodes = JSON.parse(localStorage.getItem("sunnyRecentEpisodes")) || [];


// =======================
// 3. EVENT LISTENERS
// =======================

pickBtn.addEventListener("click", pickEpisode);
saveBtn.addEventListener("click", saveFavorite);
sortRatingBtn.addEventListener("click", sortFavoritesByRating);
sortSeasonBtn.addEventListener("click", sortFavoritesBySeason);
huluBtn.addEventListener("click", openHulu);


// =======================
// 4. EPISODE PICKING
// =======================

function pickEpisode() {
	if (episodes.length === 0) {
		result.innerHTML = "Loading episodes...";
		return;
	}

	let episodeList = episodes;

	if (classicMode.checked) {
		episodeList = episodes.filter(episode => episode.season <= 8);
	}

	if (episodeList.length === 0) {
		result.innerHTML = "No episodes found.";
		return;
	}

	const randomIndex = Math.floor(Math.random() * episodeList.length);
	const episode = episodeList[randomIndex];

	selectEpisode(episode);
}

function selectEpisode(episode) {
	currentEpisode = episode;

	result.innerHTML = `
    Season ${episode.season}, Episode ${episode.number}<br>
    <strong>${cleanTitle(episode.name)}</strong>
  `;

	addRecentEpisode(episode);
}

function openHulu() {
	window.location.href = HULU_URL;
}


// =======================
// 5. FAVORITES
// =======================

function saveFavorite() {
	if (!currentEpisode) {
		result.innerHTML = "Pick an episode first!";
		return;
	}

	const alreadySaved = favorites.some(ep => ep.id === currentEpisode.id);

	if (alreadySaved) {
		result.innerHTML = "This episode is already saved!";
		return;
	}

	favorites.push({
		id: currentEpisode.id,
		name: currentEpisode.name,
		season: currentEpisode.season,
		number: currentEpisode.number,
		rating: 0,
		goat: false
	});

	saveFavorites();
	renderFavorites();

	result.innerHTML = `
    Saved Favorite:<br>
    <strong>${cleanTitle(currentEpisode.name)}</strong>
  `;
}

function renderFavorites() {
	favoritesList.innerHTML = "";

	favorites.forEach((episode, index) => {
		const card = document.createElement("div");
		card.className = "favorite-card";

		card.innerHTML = `
      <h3>${cleanTitle(episode.name)}</h3>

      <p>Season ${episode.season}, Episode ${episode.number}</p>

      <div class="stars">
        ${createStarButtons(episode, index)}
      </div>

      <button class="goat-btn ${episode.goat ? "goat-active" : ""}" onclick="toggleGoat(${index})">
        GOAT
      </button>

      <div class="favorite-actions">
        <button class="open-fav-btn" onclick="openHulu()">
          Hulu
        </button>

        <button class="remove-btn" onclick="removeFavorite(${index})">
          Remove
        </button>
      </div>
    `;

		favoritesList.appendChild(card);
	});
}

function createStarButtons(episode, index) {
	return [1, 2, 3, 4, 5].map(num => {
		const star = num <= episode.rating ? "⭐" : "☆";

		return `
      <button onclick="rateEpisode(${index}, ${num})">
        ${star}
      </button>
    `;
	}).join("");
}

function rateEpisode(index, rating) {
	favorites[index].rating = rating;

	saveFavorites();
	renderFavorites();
}

function toggleGoat(index) {
	favorites[index].goat = !favorites[index].goat;

	saveFavorites();
	renderFavorites();
}

function removeFavorite(index) {
	favorites.splice(index, 1);

	saveFavorites();
	renderFavorites();
}

function saveFavorites() {
	localStorage.setItem("sunnyFavorites", JSON.stringify(favorites));
}


// =======================
// 6. RECENT EPISODES
// =======================

function addRecentEpisode(episode) {
	recentEpisodes = recentEpisodes.filter(ep => ep.id !== episode.id);

	recentEpisodes.unshift({
		id: episode.id,
		name: episode.name,
		season: episode.season,
		number: episode.number
	});

	recentEpisodes = recentEpisodes.slice(0, 10);

	saveRecentEpisodes();
	renderRecentEpisodes();
}

function renderRecentEpisodes() {
	recentList.innerHTML = "";

	recentEpisodes.forEach(episode => {
		const card = document.createElement("div");
		card.className = "recent-card";

		card.innerHTML = `
      <strong>${cleanTitle(episode.name)}</strong><br>
      Season ${episode.season}, Episode ${episode.number}
    `;

		card.addEventListener("click", () => {
			card.classList.add("tap-bounce");

			setTimeout(() => {
				card.classList.remove("tap-bounce");
			}, 250);

			selectEpisode(episode);
		});

		recentList.appendChild(card);
	});
}

function saveRecentEpisodes() {
	localStorage.setItem("sunnyRecentEpisodes", JSON.stringify(recentEpisodes));
}


// =======================
// 7. SORTING
// =======================

function sortFavoritesByRating() {
	favorites.sort((a, b) => {
		if (b.goat !== a.goat) {
			return Number(b.goat) - Number(a.goat);
		}

		return b.rating - a.rating;
	});

	saveFavorites();
	renderFavorites();
}

function sortFavoritesBySeason() {
	favorites.sort((a, b) => {
		if (a.season === b.season) {
			return a.number - b.number;
		}

		return a.season - b.season;
	});

	saveFavorites();
	renderFavorites();
}


// =======================
// 8. LOAD EPISODES FROM TVMAZE
// =======================

async function loadEpisodes() {
	try {
		const response = await fetch(EPISODES_URL);
		const data = await response.json();

		episodes = data.map(episode => {
			return {
				id: episode.id,
				season: episode.season,
				number: episode.number,
				name: episode.name
			};
		});

		console.log("IASIP episodes loaded:", episodes);
	} catch (error) {
		console.error("Error loading episodes:", error);
		result.innerHTML = "Could not load episodes.";
	}
}


// =======================
// 9. HELPER FUNCTIONS
// =======================

function cleanTitle(title) {
	return title.replace(/"/g, "");
}


// =======================
// 10. START APP
// =======================

renderFavorites();
renderRecentEpisodes();
loadEpisodes();