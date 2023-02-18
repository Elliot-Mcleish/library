const Form = document.querySelector("form.book");
const SubmitButton = document.getElementById("book-submit-button");

Form.addEventListener("keydown", (e) => {
    if(e.target.matches("input") && e.key == "Enter"){
        if(e.target.id == "tag-input"){
            addTagFromInput(e.target);
        }else{
            if(!e.target.nextElementSibling) return;
            e.target.nextElementSibling.focus();
        }
        e.preventDefault();
        return false;
    }
});

Form.addEventListener("submit", (e) => {
    e.preventDefault();
    if(SubmitButton.disabled) return console.log("Hold your horses!");
    SubmitButton.disabled = true;

    let data = new FormData(Form);
    data.append("password", window.localStorage.getItem("password"));

    data.delete("tags");
    let tagsArr = [];
    Form.querySelectorAll("p.tag-display").forEach(pElem => {
        let itemTags = [];
        pElem.querySelectorAll("input").forEach(input => itemTags.push(input.value));
        tagsArr.push(itemTags.join("^"));
    });
    tagsArr.forEach(tagString => data.append("tags", tagString));

    let bookTitle = data.get("bookTitle") || data.get("title");
    data.delete("bookTitle");
    while(data.getAll("bookTitle").length < Copies.value) data.append("bookTitle", bookTitle);

    API("bookdata", data, {method: "POST", cache: "reload"}).then(data => {
        console.log("Complete!", data);
    }).catch(badResponse => {
        console.error("Error submitting book!", badResponse);
    }).finally(() => {
        SubmitButton.disabled = false;
    })
});

const TagListDialog = document.getElementById("tag-list");
const TagList = TagListDialog.querySelector(".list");

const QuickTagsAnchor = document.getElementById("quick-tags-to-content-item-anchor");

const AutoTagList = document.getElementById("auto-tags");
const HiddenAutoTagList = document.getElementById("hidden-auto-tags");

const CollectionTitleInput = document.getElementById("collectionTitleInput");

const SaveTagsButton = document.getElementById("save-tags");

const Contents = document.getElementById("contents");
const ContentItemCache = document.getElementById("content-item-cache");
const ContentItems = document.getElementById("content-items");
const ContentItemTemplate = ContentItems.querySelector(".content-item");

const Copies = document.getElementById("copies");
const BookItemCache = document.getElementById("book-item-cache");
const BookItems = document.getElementById("book-items");
const BookItemTemplate = BookItems.querySelector(".book-item");

let uniqueId = 1;

function handleItemNumberChange(e){
    let input = e.target;
    input.nextElementSibling.setAttribute("plural", input.value > 1);
    if(!input.reportValidity() || !input.value) return;
    let listId = input.getAttribute("list-id");
    let itemList = document.getElementById(listId);
    let itemCache = document.getElementById(listId.slice(0,-1).concat("-cache"));
    let template = itemList.firstElementChild;
    while(itemList.childElementCount != input.value){
        if(itemList.childElementCount < input.value){
            let addedItem = itemCache.lastElementChild;
            if(!addedItem){
                addedItem = template.cloneNode(true);
                addedItem.querySelectorAll("[id]").forEach(input => input.setAttribute("id", `${input.getAttribute("id")}${uniqueId}`));
                addedItem.querySelectorAll("[for]").forEach(label => label.setAttribute("for", `${label.getAttribute("for")}${uniqueId}`));
                addedItem.querySelectorAll(".tag").forEach(elem => elem.remove());
                addedItem.querySelectorAll("textarea, input:not(.const)").forEach(elem => elem.value = "");
                uniqueId++;
            }
            itemList.appendChild(addedItem);
        }else{
            let removedItem = itemList.lastElementChild;
            let shouldRemove = true;
            let allValues = Array.from(removedItem.querySelectorAll("textarea, input:not(.const)"));
            let valueNum = allValues.length;
            for(let i = 0; i < valueNum; ++i){
                if(!allValues[i].value) continue;
                itemCache.appendChild(removedItem);
                shouldRemove = false;
                break;
            }
            if(shouldRemove) removedItem.remove();
        }
    }
}

Contents.addEventListener("input", handleItemNumberChange);
Contents.addEventListener("input", e => {
    CollectionTitleInput.hidden = !(e.target.value > 1);
})
Copies.addEventListener("input", handleItemNumberChange);

// const AllTags = {
//     "Thing 0": true,
//     "Thing 1": true,
//     "Thing 2": true,
//     "Thing 3": true,
//     "Thing 4": true,
//     "Thing 5": true,
//     "Thing 6": true,
//     "Thing 7": true,
//     "Thing 8": true,
//     "Thing 9": true,
//     "Thing 10": true,
//     "Thing 11": true,
//     "Thing 12": true,
//     "Thing 13": true,
//     "Thing 14": true,
//     "Thing 15": true,
//     "Thing 16": true,
//     "Thing 17": true,
//     "Thing 18": true,
//     "Thing 19": true,
//     "poetry":   true,
//     "graded reader":false,
//     "biography":    true,
//     "graphic novel":true,
//     "historical fiction":true,
//     "A surprisingly long tag for no apparrent reason": true,
//     "spacer1":true,
//     "spacer2":true,
//     "A second surprisingly long tag for no apparrent reason": true,
//     "picture book": true,
//     "curriculum":   true,
//     "curriculumba": true,
//     "curriculus":   true,
//     "curriculuw":   true,
//     "curriculuq":   true,
//     "curriculur":   true,
//     "curriculut":   true,
//     "curriculug":   true,
//     "curriculuh":   true,
//     "curriculuj":   true,
//     "curriculuk":   true,
//     "curriculul":   true,
//     "curriculub":   true,
//     "curriculun":   true,
//     "curriculuz":   true,
// }

function editTag(event, contentItem){
    let tagInput = contentItem.querySelector(".tag-input");
    if(!event.target.classList.contains("tag") || tagInput.value) return;
    tagInput.value = event.target.innerText;
    tagInput.nextElementSibling.disabled = !tagInput.value;
    removeTag(event.target.innerText, contentItem);
    tagInput.focus();
    loadAutoTags(contentItem.querySelector('p.tag-display'));
}

function updateSaveButton(){
    SaveTagsButton.disabled = !(TagList.querySelector('.tag-box[was-checked="true"]:not(:checked), .tag-box[was-checked="false"]:checked'));
}

function openTagsListDialog(contentItem){
    let bookTitle = contentItem.querySelector("input[name='title']").value;
    TagListDialog.querySelector("p").setAttribute("book-title", bookTitle);
    if(!bookTitle) TagListDialog.querySelector("p").removeAttribute("book-title");
    contentItem.appendChild(QuickTagsAnchor);
    TagList.querySelectorAll(".tag-box").forEach(box => {
        box.checked = !(!contentItem.querySelector(`.tag-display [tagname="${encodeURIComponent(box.value)}"]`));
        box.setAttribute("was-checked", box.checked);
    });
    SaveTagsButton.disabled = true;
    TagListDialog.show();
}

function closeTagsListDialog(){
    TagListDialog.appendChild(QuickTagsAnchor);
    TagListDialog.close();
}

function saveTagsFromDialog(){
    let contentItem = QuickTagsAnchor.parentElement;
    TagList.querySelectorAll(".tag-box").forEach(box => {
        if(box.checked){
            addTag(box.value, contentItem);
        }else{
            removeTag(box.value, contentItem);
        }
    });
    closeTagsListDialog();
}

function loadAutoTags(tagList){
    // let tagList = event.target.parentElement.querySelector("p.tag-display");
    //loop through all hidden autocomplete tags
    Array.from(HiddenAutoTagList.children).forEach(hiddenAutoTag => {
        //if hidden autocomplete tag has not been added, show it
        if(!tagList.querySelector(`[tagname="${encodeURI(hiddenAutoTag.value)}"]`)) AutoTagList.appendChild(hiddenAutoTag);
    });

    //loop through all added tags
    Array.from(tagList.children).forEach(tag => {
        //hide autocomplete option
        let option = document.getElementById(`auto-tag[${tag.getAttribute("tagname")}]`);
        if(option) HiddenAutoTagList.appendChild(option);
    });

    sortAutoTags();
}

function sortAutoTags(){
    Array.from(AutoTagList.children)
        .sort((a, b) => a.value.localeCompare(b.value))
        .forEach(option => AutoTagList.appendChild(option));
}

function loadAutoTag(tag){
    if(document.getElementById(`auto-tag[${encodeURIComponent(tag)}]`)) return console.log("Autocomplete option already exists!");
    let option = document.createElement("option");
    option.value = tag;
    option.id = `auto-tag[${encodeURIComponent(tag)}]`;
    AutoTagList.appendChild(option);
}

function addTagFromInput(inputElem){
    addTag(inputElem.value, inputElem.parentElement);
    inputElem.value = "";
    inputElem.nextElementSibling.disabled = true;
    inputElem.focus();
    loadAutoTags(inputElem.parentElement.querySelector('p.tag-display'));
}

function addTag(tag, contentItem){
    let tagDisplay = contentItem.querySelector(".tag-display");
    if(tagDisplay.querySelector(`[tagname="${encodeURIComponent(tag)}"]`)) return console.log("Already There, Dummy!");
    let tagElem = document.createElement("span");
    let input = document.createElement("input");
    tagElem.classList.add("tag");
    tagElem.setAttribute("tagname", encodeURIComponent(tag));
    input.setAttribute("readonly", "true");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", "tags");
    input.value = encodeURIComponent(tag);
    tagElem.innerText = tag;
    tagElem.appendChild(input);
    tagDisplay.appendChild(tagElem);
    // if(document.getElementById(`auto-tag[${encodeURIComponent(tag)}]`)) return;
    // console.log("Loading new Tag into autocomplete list...");
    loadAutoTag(tag);
    // hideAutoTag(tag);
}

function removeTag(tag, contentItem){
    let tagElem = contentItem.querySelector(`.tag-display [tagname="${encodeURIComponent(tag)}"]`);
    if(!tagElem) return;
    tagElem.remove();
    // showAutoTag(tag);
}

function loadAllTags(tags){
    for(let tag in tags){
        loadAutoTag(tag);
        if(!tags[tag].common) continue;
        let box = document.createElement("input");
        box.classList.add("tag-box");
        box.setAttribute("type", "checkbox");
        box.setAttribute("value", tag);
        box.setAttribute("tag", encodeURIComponent(tag));
        TagList.appendChild(box);
    }
}

// for(let tag in AllTags){
//     let common = AllTags[tag];
//     loadAutoTag(tag);
//     if(!common) continue;
//     let box = document.createElement("input");
//     box.classList.add("tag-box");
//     box.setAttribute("type", "checkbox");
//     box.setAttribute("value", tag);
//     box.setAttribute("tag", encodeURIComponent(tag));
//     TagList.appendChild(box);
// }