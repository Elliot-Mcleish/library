const SearchForm = document.querySelector("form.search");
const SearchInput = document.getElementById("search")

SearchForm.addEventListener("submit", e => {
    e.preventDefault();
    if(SearchInput.value == "Set Password") switchTab("Set Password");
    return false;
});