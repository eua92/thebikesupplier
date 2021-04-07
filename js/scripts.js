var item = parseInt(document.getElementById("basketItems").innerHTML);
if (localStorage.getItem('itemCount') == undefined) {
    document.getElementById("basketItems").innerHTML = 0;
} else {
    document.getElementById("basketItems").innerHTML = localStorage.getItem('itemCount');
}

var db;
var tableBody = document.getElementsByTagName('tbody')[0];
// Create database
window.onload = function () {
    var request = window.indexedDB.open('products', 1);

    request.onsuccess = function () {
        db = request.result;
        displayData();
    }

    request.onupgradeneeded = function (event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });

        objectStore.createIndex('ImageSrc', 'ImageSrc', { unique: false });
        objectStore.createIndex('Title', 'Title', { unique: false });
        objectStore.createIndex('Quantity', 'Quantity', { unique: false });
        objectStore.createIndex('Price', 'Price', { unique: false });
    }
}

// Add Products to the Database
function addProduct() {
    // Get the itemBox div
    var itemBox = event.target.parentElement.parentElement.parentElement.parentElement;
    // Get the Image src
    var imageSrc = itemBox.getElementsByTagName('img')[0].src;
    // Get the Product title
    var title = itemBox.getElementsByTagName('h5')[0].innerText;
    // Get the Product price
    var price = itemBox.getElementsByTagName('h6')[0].innerText;
    var quantity = 1;

    var newItem = { ImageSrc: imageSrc, Title: title, Quantity: quantity, Price: price }

    var transaction = db.transaction(['products'], 'readwrite');
    var objectStore = transaction.objectStore('products');
    var request = objectStore.add(newItem);

    transaction.oncomplete = function() {
        displayData();
    }
}

// Display products on the Basket
function displayData() {
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    var objectStore = db.transaction('products').objectStore('products');
    objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;

        if (cursor) {
            var tableRow = document.createElement('tr');
            // var tableData = `<td><img class="img-fluid" src="${cursor.value.ImageSrc}" width="100" 
            // height="100"><span>${cursor.value.Title}</span></td><td><input class="items-quantity" 
            // style='width:50px;' type="number" min="0" value="${cursor.value.Quantity}"></td><td><button 
            // class="btn btn-danger" type="button">REMOVE</button></td><td>${cursor.value.Price}</td>`;

            var tableData = "<td><img class='img-fluid' src=" + "'" + cursor.value.ImageSrc + "'" +
                "width='100' height='100'><span>" + cursor.value.Title +
                "</span></td><td><input class='items-quantity'" +
                "style='width:50px;' type='number' min='0' value=" + cursor.value.Quantity +
                "></td><td><button class='btn btn-danger' type='button'>REMOVE</button></td><td>"
                + cursor.value.Price + "</td>";
            tableRow.innerHTML = tableData;
            tableBody.appendChild(tableRow);

            tableRow.setAttribute('data-product-id', cursor.value.id);

            tableRow.getElementsByClassName('btn-danger')[0].addEventListener('click', deleteItem);
            tableRow.getElementsByClassName('items-quantity')[0].addEventListener('change', quantityChanged);

            cursor.continue();
        }

        updateBasketTotal();
    }
}

// Delete Products on the Basket
function deleteItem() {
    var buttonClicked = event.target;
    var productId = Number(buttonClicked.parentNode.parentNode.getAttribute('data-product-id'));
    var transaction = db.transaction(['products'], 'readwrite');
    var objectStore = transaction.objectStore('products');
    var request = objectStore.delete(productId);

    transaction.oncomplete = function () {
        buttonClicked.parentNode.parentNode.parentNode.removeChild(buttonClicked.parentNode.parentNode)
        updateBasketTotal();
    }
}

function quantityChanged() {
    var quantityValue = document.getElementsByClassName('items-quantity')[0].value;

    var transaction = db.transaction(['products'], 'readwrite');
    var objectStore = transaction.objectStore('products');

    objectStore.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;
        const updateData = cursor.value;
        updateData.Quantity = quantityValue;
        const request = cursor.update(updateData);
    }

    updateBasketTotal();
}

function updateBasketTotal() {
    var basketItemContainer = document.getElementsByTagName('tbody')[0];
    var basketRows = basketItemContainer.getElementsByTagName('tr');
    var total = 0;
    var totalQuantity = 0;
    for (var i = 0; i < basketRows.length; i++) {
        var basketRow = basketRows[i];
        var priceElement = basketRow.getElementsByTagName('td')[3];
        var quantityElement = basketRow.getElementsByClassName('items-quantity')[0];
        var price = parseFloat(priceElement.innerText.replace('€', ''));
        var quantity = parseInt(quantityElement.value);
        totalQuantity += quantity;
        total = total + (price * quantity);
    }

    total = Math.round(total * 100) / 100;
    localStorage.setItem('total', total);
    document.getElementsByTagName('tfoot')[0].children[0].children[1].innerText = '€ ' + localStorage.getItem('total');

    itemCount = totalQuantity;
    localStorage.setItem('itemCount', itemCount);
    document.getElementById("basketItems").innerHTML = localStorage.getItem('itemCount');
}

// Create Quickview Modal
function quickview() {
    var itemBox = event.target.parentElement.parentElement.parentElement.parentElement;
    // Get imageSrc
    var imageSrc = itemBox.getElementsByTagName('img')[0].src;
    // Get the title
    var title = itemBox.getElementsByTagName('h5')[0].innerText;

    // Get the modal header
    var modalHeader = document.getElementById('bikeModal').getElementsByClassName('modal-header')[0];
    // Get the modal Body
    var modalBody = document.getElementById('bikeModal').getElementsByClassName('modal-body')[0];
    var modalCol = modalBody.children[0].children[0];

    // Create the elements
    var modalImage = document.createElement('img');
    modalImage.className = 'img-fluid';
    modalImage.setAttribute('alt', title);
    var modalTitle = document.createElement('h3');

    // Create modal button
    var modalButton = document.createElement('button');
    modalButton.setAttribute('type', 'button');
    modalButton.setAttribute('class', 'close');
    modalButton.setAttribute('data-dismiss', 'modal');
    modalButton.setAttribute('aria-label', 'Close');
    modalButton.innerHTML = '&times';

    modalImage.src = imageSrc;
    modalTitle.innerHTML = title;

    // Append the elements to the modal body
    while (modalHeader.firstChild) {
        modalHeader.removeChild(modalHeader.firstChild);
    }   
    modalHeader.prepend(modalTitle);
    modalHeader.append(modalButton);

    // Append the elements to the modal body
    while (modalCol.firstChild) {
        modalCol.removeChild(modalCol.firstChild);
    }   
    modalCol.append(modalImage);
}

// Add a function to the purchase button on the basket
var basketForm = document.getElementById('basketForm');
basketForm.onsubmit = alertPurchase;
function alertPurchase(event) {
    event.preventDefault();
    var modalBody = document.getElementById('basketModal').getElementsByTagName('tbody')[0];
    if (modalBody.firstChild) {
        alert('Login to complete your purchase!');
    } else {
        alert('There are no items in the basket!');
    }
}

// Add a function to the login form
var loginForm = document.getElementById('loginForm');
loginForm.onsubmit = alertLogin;
function alertLogin(event) {
    event.preventDefault();
    alert('Wrong e-mail address or password!');
}

