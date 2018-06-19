import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as SearchView from './views/searchView';
import * as RecipeView from './views/recipeView';
import * as ListView from './views/listView';
import * as LikesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/* Global state of the app 
* - Search object
* - Current recipe object
* - Shopping list object
* - Liked recipes
*/
const state = {};


/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
    // 1) Get query from view
    const query = SearchView.getInput();

    if(query){
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        SearchView.clearInput();
        SearchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4) Search for recipes
            await state.search.getResults(); // await till it returns a promise (every async ftn returns a promise)

            // 5) Render results on UI
            clearLoader();
            SearchView.RenderResults(state.search.result);
        } catch (err){
            alert('Something wrong with the search...');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault(); //The event.preventDefault() method stops the default action of an element from happening
    // in this case to prevent page from reloading when we submit our form
    controlSearch();
});


// The Element.closest() method returns the closest ancestor of the current element (or the current element itself) which matches the selectors given in parameter
elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10); // base 10 which refers to nbs 0 to 9 (if choose 2 then just 0 and 1)
        SearchView.clearResults();
        SearchView.RenderResults(state.search.result, goToPage);
    }
});


/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    // Get id from url
    const id = window.location.hash.replace('#','');

    if (id) {
        // Prepare UI for changes
        RecipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
        if (state.search) SearchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render recipe
            clearLoader();
            RecipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        } catch (err) {
            alert('Error processing recipe!');
        }
    }
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

['hashchange','load'].forEach(event => window.addEventListener(event, controlRecipe));


/**
 * LIST CONTROLLER
 */
const controlList = () => {
    // create a new list if there is none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        ListView.renderItem(item);
    });
};

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')){ // check if .shopping__delete orr its children is clicked
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        ListView.deleteItem(id);

        // Handle the count update
    } else if (e.target.matches('shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


/**
 * LIKE CONTROLLER
 */

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    
    // user has not yet liked current recipe
    if (!state.likes.isLiked(currentID)){
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // Toggle the like button
        LikesView.toggleLikeBtn(true);

        // Add like to UI list
        LikesView.renderLike(newLike);

        // user has liked current recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        LikesView.toggleLikeBtn(false);

        // Remove like from UI list
        LikesView.deleteLike(currentID);
    }

    LikesView.toggleLikeMenu(state.likes.getNumLikes());
}

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    LikesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => LikesView.renderLike(like));
});


// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) { // .btn-decrease * means any child to btn-decrease
        // Decrease button is clicked
        if (state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            RecipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        RecipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')){
        // Like controller
        controlLike();
    }
});