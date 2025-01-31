import { createApp, ref, useTemplateRef, onMounted, onUnmounted, watch, nextTick, computed } from "https://unpkg.com/vue@3.5.13/dist/vue.esm-browser.js";
import { typeColors } from "./global.js";
import { fetchHeldItems, fetchPokemonDetails, fetchPokemonMoves, getEvolutionChain } from "../service/api.js";

const STATE = {
    LOADED : 'loaded',
    LOADING: 'loading',
    NEWLOAD: 'newloading'
};

const moveLoaded = ref(false);
const itemsLoaded = ref(false);
const evolutionLoaded = ref(false);

const statColors = {
    hp: "#4CAF50",           // Green
    attack: "#F44336",       // Red
    defense: "#2196F3",      // Blue
    "special-attack": "#9C27B0",  // Purple
    "special-defense": "#FFEB3B", // Yellow
    speed: "#FF9800"         // Orange
};

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);

const state = ref({
    pageState: STATE.LOADING,
});

const pokemonDetail = ref({});
const movesPokemon = ref({});
const heldItems = ref({});
const evolution = ref({});

fetchPokemonDetails(params.get('id')).then((value) => {
     if (value)
     {
        pokemonDetail.value = value;
        state.value.pageState = STATE.LOADED;
     }
});


async function loadImage(start) 
{
    for (let i = start; i < evolution.value.length; i++)
    {
        if (!evolution.value[i]) return;
        const promise = new Promise((resolve, reject) => {
            const pokemon = evolution.value[i];
            const img = new Image();
            img.src = pokemon.sprites.front_default;
            img.classList.add('img');

            img.onload = () => resolve({
                id: 'pokemon' + pokemon.id,
                img
            });
            img.onerror = () => reject(new Error("Error Load Image"));
        });
        
        promise.then((pokemon) => {
            const pokemonImg = document.getElementById(pokemon.id);
            if (pokemonImg)
            {
                pokemonImg.innerHTML = "";
                pokemonImg.appendChild(pokemon.img);
            }
        });
    }
}

const stats = computed(() => {
    const stats = [];
    for (let stat of pokemonDetail.value.stats)
    {
        stats.push({
            style: {
                width: stat.base_stat / 255 * 100 + '%',
                backgroundColor: statColors[stat.stat.name],
            },
            name: stat.stat.name,
            base_stat: stat.base_stat
        });
    }

    return stats;
});

const mainImage = createApp({
    data() {
        return {
            pokemonDetail: pokemonDetail,
        }
    },

    methods: {
        async loadImage() {
            const img = document.createElement('img');
            img.src = this.pokemonDetail.sprites.front_default;
            img.onload = () => {
                document.getElementById("main-image").src = img.src;
            };
        }
    },

    mounted() {
        this.loadImage();
    }

});


const main = createApp({
    setup() {

        watch(() => state.value.pageState, async (newValue, oldValue) => {
            await nextTick();
            fetchPokemonMoves(pokemonDetail.value.moves).then((value) => {
                movesPokemon.value = value;
                moveLoaded.value = true;
            });

            fetchHeldItems(pokemonDetail.value.held_items).then((value) => {
                heldItems.value = value;
                itemsLoaded.value = true;
            });

            getEvolutionChain(pokemonDetail.value.species.url).then(value => {
                evolution.value = value;
                evolutionLoaded.value = true;
                loadImage(0);
            }) ;


            mainImage.mount("#main-image-container");
        }, { once : true });

        return {
            state,
            id: params.get("id"),
            pokemonDetail,
            stats,
            typeColors,
            moveLoaded,
            movesPokemon,
            itemsLoaded,
            heldItems,
            evolutionLoaded,
            evolution
        }
    },

    methods: {
        next()
        {
            window.location.href = `/vue_pokemon/pages/pokemonDetail.html?id=${parseInt(this.id) + 1}`;
        },
    
        prev()
        {
            window.location.href = `/vue_pokemon/pages/pokemonDetail.html?id=${parseInt(this.id) - 1}`;
        },
        home()
        {
            window.location.href = `/vue_pokemon/index.html`;
        }
    }
});


main.mount("#pokemon-detail");

