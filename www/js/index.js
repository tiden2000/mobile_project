var ERROR = 'ERROR';
var currentPropertyId = 'currentPropertyId';
// Open database or create one if not exist
var db = window.openDatabase('Rentalz', '1.0', 'Rentalz', 20000);

// Detect user device
if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    $(document).on('deviceready', onDeviceReady);
}
else {
    $(document).on('ready', onDeviceReady);
}

// Detect screen orientation
$(window).on('orientationchange', onOrientationChange);

function onOrientationChange(e) {
    if (e.orientation == 'portrait') {
        console.log('Portrait.');
    }
    else {
        console.log('Landscape.');
    }
}

// Dsiplay panel
$(document).on('vclick', '#page-home #panel-open', function () {
    $('#page-home #panel').panel('open');
});

$(document).on('vclick', '#page-create #panel-open', function () {
    $('#page-create #panel').panel('open');
});

$(document).on('vclick', '#page-list #panel-open', function () {
    $('#page-list #panel').panel('open');
});

$(document).on('vclick', '#page-detail #panel-open', function () {
    $('#page-detail #panel').panel('open');
});

$(document).on('vclick', '#page-about #panel-open', function () {
    $('#page-about #panel').panel('open');
});

// Display error log for database query
function transactionError(tx, error) {
    console.log(`SQL Error ${error.code}. Message: ${error.message}.`, ERROR);
}

// Create database if not exist
document.addEventListener('deviceready', onDeviceReady, true);

function onDeviceReady() {
    console.log(`Device is ready.`);
    db.transaction(function (tx){
            // Create 'Property' table
            var query = `CREATE TABLE IF NOT EXISTS Property (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL UNIQUE,Address TEXT NOT NULL,

                City INTEGER NOT NULL,District INTEGER NOT NULL,Ward INTEGER NOT NULL,

                Type INTEGER NOT NULL,Bedroom INTEGER NOT NULL,Date INTEGER NOT NULL,
                
                Price INTEGER NOT NULL,Furniture INTEGER,Reporter TEXT NOT NULL)`;

            tx.executeSql(query, [], function(tx, result) {
                console.log(`Create table 'Property' successfully`); 
            }, transactionError);

            // 'Note' table
            var query = `CREATE TABLE IF NOT EXISTS Note 
            (Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Note TEXT NOT NULL,
            Datetime DATE NOT NULL,
            PropertyId INTEGER NOT NULL,
            FOREIGN KEY (PropertyId) REFERENCES Property(Id))`;

            tx.executeSql(query, [], function (tx, result) {
                console.log(`Create table 'Note' successfully.`);
            }, transactionError);      
            });         

    // Add options to select city/district/ward into the database
    prepareDatabase(db);
}

// Form validation
// This will check if all required inputs are correctly filled when user press the button 
// Return 'false' if one of the following fields is not filled
function isValid(form) {
    var isValid = true;
    var error = $(`${form} #error`);

    error.empty();

    if ($(`${form} #city`).val() == -1) {  // City
        isValid = false;
        error.append('<p>* City is required.</p>');
    }

    if ($(`${form} #district`).val() == -1) {  // District
        isValid = false;
        error.append('<p>* District is required.</p>');
    }

    if ($(`${form} #ward`).val() == -1) {  // Ward
        isValid = false;
        error.append('<p>* Ward is required.</p>');
    }

    if ($(`${form} #type`).val() == -1) {  // Type
        isValid = false;
        error.append('<p>* Type is required.</p>');
    }

    return isValid;
}

/*


********** ADD PROPERTY **********


*/

// Submit form to add property
$(document).on('submit', '#page-create #frm-register', confirmProperty);
$(document).on('submit', '#page-create #frm-confirm', addProperty);

// Insert property into database
function addProperty(e) {
    e.preventDefault();

    // Validation for corret input in all required fields
    if (isValid('#page-create #frm-register')) {
        // Get input data from form
        var form_data = getFormByName('#page-create #frm-register', true);
        var date = new Date();

    db.transaction(function (tx) {
        var query = 'INSERT INTO Property (Name, Address, City, District, Ward, Type, Bedroom, Date, Price, Furniture, Reporter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        tx.executeSql(query, [form_data.Name, form_data.Street, form_data.City, form_data.District, form_data.Ward, form_data.Type, form_data.Bedroom, date, form_data.Price, form_data.Furniture, form_data.Reporter], transactionSuccess, transactionError);

        console.log(query);

        function transactionSuccess(tx, result) {
            console.log(`Added property '${form_data.Name}' successfully.`);

            // Refresh page after adding property
            $('#frm-register').trigger('reset');
            $('#page-create #frm-register #error').empty();
            $('#name').focus();

            $('#page-create #frm-confirm').popup('close');
           if(note != ''){
            var dateTime = new Date();
              db.transaction(function (tx) {
                   var query = `INSERT INTO Note (Note, PropertyId, Datetime) VALUES (?, ?, ?)`;
                   tx.executeSql(query, [form_data.Note, result.insertId, dateTime], transactionSuccess, transactionError);
                   function transactionSuccess(tx, result) {
                       console.log(`Add new note to property '${name}' successfully.`);
                    }
                });
                
            }
            }
           
        });
    }
            
}

// Check if the property has existed duplicate then open confirmation popup
function confirmProperty(e) {
    e.preventDefault();

    if (isValid('#page-create #frm-register')) {
        // Get user input from the form
        var form_data = getFormByName('#page-create #frm-register', true);

        db.transaction(function (tx) {
            var query = 'SELECT * FROM Property WHERE Name = ?';
            tx.executeSql(query, [form_data.Name], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                // If no duplicate then open a popup displying all the user input
                if (result.rows[0] == null) {
                    console.log('Open confirmation panel');

                    $('#page-create #error').empty();

                    setInfoHtml('#page-create #frm-confirm', form_data, true);

                    $('#page-create #frm-confirm').popup('open');
                }

                // Write error into console log if duplicate
                else {
                    var error = 'Property name already exists';
                    $('#page-create #error').empty().append(error);
                    console.log(error, ERROR);
                }
            }
        });
    }
}

// Get all user input data from a form by its name and store their values into an array
function getFormByName(form, isNote) {
    var note = isNote ? $(`${form} #note`).val() : '';

    var form_data = {
        'Name': $(`${form} #name`).val(),
        'Street': $(`${form} #street`).val(),
        'City': $(`${form} #city option:selected`).text(),
        'District': $(`${form} #district option:selected`).text(),
        'Ward': $(`${form} #ward option:selected`).text(),
        'Type': $(`${form} #type option:selected`).text(),
        'Bedroom': $(`${form} #bedroom`).val(),
        'Price': $(`${form} #price`).val(),
        'Furniture': $(`${form} #furniture option:selected`).text(),
        'Reporter': $(`${form} #reporter`).val(),
        'Note': note
    };

    return form_data;
}

// Set all form input with data from an array.
// This is used in combination with 'getFormByName' to return form data again for confirmation.
function setInfoHtml(form, form_data, isNote, isDate = false) {
    $(`${form} #name`).text(form_data.Name);
    $(`${form} #street`).text(form_data.Street);
    $(`${form} #city`).text(form_data.City);
    $(`${form} #district`).text(form_data.District);
    $(`${form} #ward`).text(form_data.Ward);
    $(`${form} #type`).text(form_data.Type);
    $(`${form} #bedroom`).text(form_data.Bedroom);
    $(`${form} #price`).text(`${form_data.Price.toLocaleString('en-US')} VNĐ / month`);
    $(`${form} #furniture`).text(form_data.Furniture);
    $(`${form} #reporter`).text(form_data.Reporter);

    if (isNote)
        $(`${form} #note`).text(form_data.Note);

    if (isDate)
        $(`${form} #date`).text(form_data.DateAdded);
}


// Check if the property name exists or not
function checkProperty(name) {
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Property WHERE Name = ?';
        tx.executeSql(query, [name], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] == null) {
                $('#frm-register #error').trigger('reset');
                $('#page-create #property #error').empty();
                $('#page-create #frm-confirm #name').val(name);
                
                $('#page-create #frm-confirm').popup('open');
                console.log(`Added Property '${name}' successfully.`);
            }
            else {
                var error = 'Property name already exists. Please try again.';
                $('#page-create #error').empty().append(error);
                console.log(error, ERROR);
            }
        }
    });
}

// event for import city into register form
$(document).on('pagebeforeshow', '#page-create',function(){
    importCity('#page-create #frm-register');
    importDistrict('#page-create #frm-register');
    importWard('#page-create #frm-register');
    importFurniture('#page-create #frm-register');
    importType('#page-create #frm-register');
});
// event for import city into register form
$(document).on('change', '#page-create #frm-register #city',function(){
    importDistrict('#page-create #frm-register');
    importWard('#page-create #frm-register');
});
// event for import ward into register form 
$(document).on('change', '#page-create #frm-register #district',function(){
    importWard('#page-create #frm-register');
});

// event for import city into update form
$(document).on('pagebeforeshow', '#page-detail',function(){
    importCity('#page-detail #frm-update');
    importDistrict('#page-detail #frm-update');
    importWard('#page-detail #frm-update');
    importFurniture('#page-detail #frm-update');
    importType('#page-detail #frm-update');
});
// event for import city into register form
$(document).on('change', '#page-detail #frm-update #city',function(){
    importDistrict('#page-detail #frm-update');
    importWard('#page-detail #frm-update');
});
// event for import ward into register form 
$(document).on('change', '#page-detail #frm-update #district',function(){
    importWard('#page-detail #frm-update');
});
//
// event for import city into search form
$(document).on('pagebeforeshow', '#page-list',function(){
    importCity('#page-list #frm-search');
    importDistrict('#page-list #frm-search');
    importWard('#page-list #frm-search');
    importFurniture('#page-list #frm-search');
    importType('#page-list #frm-search');
});
// event for import city into search form
$(document).on('change', '#page-detail #frm-update #city',function(){
    importDistrict('#page-list #frm-search');
    importWard('#page-list #frm-search');
});
// event for import ward into search form
$(document).on('change', '#page-detail #frm-update #district',function(){
    importWard('#page-list #frm-search');
});



// import city into select form
function importCity(form, selectedId = -1 ) {
    db.transaction(function(tx) {
        var query = 'SELECT * FROM City ORDER BY Name';
        tx.executeSql(query, [], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var optionList = `<option value = -1>Select City</option>`;
            for (let item of result.rows) {
                if(item.Id == selectedId) {
                    optionList += `<option value ='${item.Id}' selected>${item.Name}</option>`;
                }
                else{
                    optionList += `<option value ='${item.Id}'>${item.Name}</option>`;
                }
            }

        $(`${form} #city`).html(optionList);
        $(`${form} #city`).selectmenu('refresh', true);
        }
    });
}
// import district into select form
function importDistrict(form, selectedId = -1 ) {
    var id = $(`${form} #city`).val();
    db.transaction(function(tx) {
        var query = 'SELECT * FROM District WHERE CityId = ? ORDER BY Name';
        tx.executeSql(query, [id], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var optionList = `<option value = -1>Select District</option>`;
            for (let item of result.rows) {
                if(item.Id == selectedId) {
                    optionList += `<option value ='${item.Id}' selected>${item.Name}</option>`;
                }
                else{
                    optionList += `<option value ='${item.Id}'>${item.Name}</option>`;
                }
            }

        $(`${form} #district`).html(optionList);
        $(`${form} #district`).selectmenu('refresh', true);
        }
    });
}
// import ward into select form 
function importWard(form, selectedId = -1 ) {
    var id = $(`${form} #district`).val();
    db.transaction(function(tx) {
        var query = 'SELECT * FROM Ward WHERE DistrictId = ? ORDER BY Name';
        tx.executeSql(query, [id], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var optionList = `<option value = -1>Select Ward</option>`;
            for (let item of result.rows) {
                if(item.Id == selectedId) {
                    optionList += `<option value ='${item.Id}' selected>${item.Name}</option>`;
                }
                else{
                    optionList += `<option value ='${item.Id}'>${item.Name}</option>`;
                }
            }

        $(`${form} #ward`).html(optionList);
        $(`${form} #ward`).selectmenu('refresh', true);
        }
    });
}

// import (Property) type into select form
function importType(form, selectedId = -1 ) {
    db.transaction(function(tx) {
        var query = 'SELECT * FROM Type ORDER BY Id';
        tx.executeSql(query, [], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var optionList = `<option value = -1>Select Type</option>`;
            for (let item of result.rows) {
                if(item.Id == selectedId) {
                    optionList += `<option value ='${item.Id}' selected>${item.Name}</option>`;
                }
                else{
                    optionList += `<option value ='${item.Id}'>${item.Name}</option>`;
                }
            }

        $(`${form} #type`).html(optionList);
        $(`${form} #type`).selectmenu('refresh', true);
        }
    });
}


// import furniture into select form
function importFurniture(form, selectedId = -1 ) {
    db.transaction(function(tx) {
        var query = 'SELECT * FROM Furniture ORDER BY Id';
        tx.executeSql(query, [], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var optionList = `<option value = -1>Select Furniture</option>`;
            for (let item of result.rows) {
                if(item.Id == selectedId) {
                    optionList += `<option value ='${item.Id}' selected>${item.Name}</option>`;
                }
                else{
                    optionList += `<option value ='${item.Id}'>${item.Name}</option>`;
                }
            }

        $(`${form} #furniture`).html(optionList);
        $(`${form} #furniture`).selectmenu('refresh', true);
        }
    });
}

// Show property list
$(document).on('pagebeforeshow', '#page-list', showList);

function showList() {
    db.transaction(function (tx) {
        var query = 'SELECT Id, Name, Type, Price FROM Property';
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            console.log(`Get list of properties successfully.`);

            // Prepare the list of properties.
            var listProperty = `<ul id='list-property' data-role='listview' data-filter='true' data-filter-placeholder='Search Properties...'
                                                     data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for (let property of result.rows) {
                listProperty += `<li><a data-details='{"Id" : ${property.Id}}'>
                                    <p>ID: ${property.Id}</p>

                                    <h3>NAME:</h3>
                                    <p style="font-size:26px;text-decoration: underline;">${property.Name}</p>

                                    <h3>TYPE:</h3>
                                    <p style="font-size:26px;text-decoration: underline;">${property.Type}</p>

                                    <h3>PRICE:</h3>
                                    <p style="font-size:26px;text-decoration: underline;">${property.Price} VND</p>
                                    </a>
                                </li>`;
            }
            listProperty += `</ul>`;

            // Add list to UI.
            $('#list-property').empty().append(listProperty).listview('refresh').trigger('create');

            console.log(`Show list of properties successfully.`);
        }
    });
}


// Save Property Id.
$(document).on('vclick', '#list-property li a', function (e) {
    e.preventDefault();

    var id = $(this).data('details').Id;
    localStorage.setItem('currentPropertyId', id);

    $.mobile.navigate('#page-detail', { transition: 'none' });
});

// Show property details
$(document).on('pagebeforeshow', '#page-detail', showDetail);

function showDetail() {
    var id = localStorage.getItem('currentPropertyId');

    db.transaction(function (tx) {
        var query = `SELECT Property.*, City.Name AS CityName, District.Name AS DistrictName, Ward.Name AS WardName, Type.Name AS TypeName, Furniture.Name AS FurnitureName FROM Property
                     LEFT JOIN City ON City.Id = Property.City
                     LEFT JOIN District ON District.Id = Property.District
                     LEFT JOIN Ward ON Ward.Id = Property.Ward
                     LEFT JOIN Type ON Type.Id = Property.Type
                     LEFT JOIN Furniture ON Furniture.Id = Property.Furniture
                     WHERE Property.Id = ?`;
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var errorMessage = 'Property not found.';

            if (result.rows[0] != null) {
                log(`Get details of Property '${id}' successfully.`);
                id = result.rows[0].Id;
                name = result.rows[0].Name;
                street = result.rows[0].Address;
                city = result.rows[0].City;
                district = result.rows[0].District;
                ward = result.rows[0].Ward;
                type = result.rows[0].Type;
                furniture = result.rows[0].Furniture;
                bedroom = result.rows[0].Bedroom;
                date = result.rows[0].Date;
                price = result.rows[0].Price;
                reporter = result.rows[0].Reporter; 
            }
            else {
                log(errorMessage, ERROR);

                $('#page-detail #btn-update').addClass('ui-disabled');
                $('#page-detail #btn-delete-confirm').addClass('ui-disabled');
            }

            $('#page-detail #id').val(id);
            $('#page-detail #name').val(name);
            $('#page-detail #street').val(street);
            $('#page-detail #city').val(city);
            $('#page-detail #district').val(district);
            $('#page-detail #ward').val(ward);
            $('#page-detail #type').val(type);
            $('#page-detail #furniture').val(furniture);
            $('#page-detail #bedroom').val(bedroom);
            $('#page-detail #date').val(date);
            $('#page-detail #price').val(price);
            $('#page-detail #reporter').val(reporter);
            
        }
    });
    showNote();
}
// Delete Property
$(document).on('submit', '#page-detail #frm-delete', deleteProperty);
$(document).on('keyup', '#page-detail #frm-delete #txt-delete', confirmDeleteProperty);

function confirmDeleteProperty() {
    var text = $('#page-detail #frm-delete #txt-delete').val();

    if (text == 'confirm delete') {
        $('#page-detail #frm-delete #btn-delete').removeClass('ui-disabled');
    }
    else {
        $('#page-detail #frm-delete #btn-delete').addClass('ui-disabled');
    }
}

function deleteProperty(e) {
    e.preventDefault();

    var id = localStorage.getItem('currentPropertyId');

    db.transaction(function (tx) {
        var query = 'DELETE FROM Note WHERE PropertyId = ?';
        tx.executeSql(query, [id], function (tx, result) {
            console.log(`Delete notes of property '${id}' successfully.`);
        }, transactionError);

        var query = 'DELETE FROM Property WHERE Id = ?';
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            console.log(`Delete property '${id}' successfully.`);

            $('#page-detail').trigger('reset');

            $.mobile.navigate('#list-property', { transition: 'none' });
        }
    });
}
// Search filter
$(document).on('vclick', '#list-property #btn-filter-popup', openFormSearch);
$(document).on('keyup', $('#page-list #list-property'), filterProperty);
function openFormSearch(e) {
    e.preventDefault();
    prepareForm('#page-list #frm-search');
    $('#page-list #frm-search').popup('open');
}
function filterProperty() {
    var filter = $('#page-list #list-property').val().toLowerCase();
    var li = $('#page-list #list-property ul li');

    for (var i = 0; i < li.length; i++) {
        var a = li[i].getElementsByTagName("a")[0];
        var text = a.textContent || a.innerText;

        li[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? "" : "none";
    }
}
// Add Note 
$(document).on('submit', '#page-detail #frm-note', addNote);
function addNote(e) {
    e.preventDefault();

    var propertyId = localStorage.getItem('currentPropertyId');
    var note = $('#page-detail #frm-note #message').val();
    var dateTime = new Date();
    db.transaction(function (tx) {
        var query = 'INSERT INTO Note (PropertyId, Note, Datetime) VALUES (?, ?, ?)';
        tx.executeSql(query, [propertyId, note, dateTime], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            console.log(`Add new comment to property '${propertyId}' successfully.`);

            $('#page-detail #frm-note').trigger('reset');

            showNote();
        }
    });
}
// Display Note
function showNote() {
    var propertyId = localStorage.getItem('currentPropertyId');
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Note WHERE PropertyId = ?';
        tx.executeSql(query, [propertyId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            console.log(`Get list of notes successfully.`);

            // Prepare the list of comments.
            var listNote = '';
            for (let note of result.rows) {
                listNote += `<div class = 'list'>
                                <small>${note.Datetime}</small>
                                <h3>${note.Note}</h3>
                                </div>`;
            }
            // Add list to UI.
            $('#list-note').empty().append(listNote);

            console.log(`Show list of notes successfully.`);
        }
    });
}

// Property search event
$(document).on('submit', '#page-list #frm-search', search);

// Search Property
function search(e) {
    e.preventDefault();

    var name = $('#page-list #frm-search #name').val();
    var type = $('#page-list #frm-search #type').val();
    type = convertType(type);
    var priceMin = $('#page-list #frm-search #price-min').val();
    var priceMax = $('#page-list #frm-search #price-max').val();

    db.transaction(function (tx) {
        var query = `SELECT Property.Id AS Id, Property.Name AS Name, Price, Bedroom, Type, City.Name AS City
                     FROM Property LEFT JOIN City ON Property.City = City.Id
                     WHERE`;

        query += name ? ` Property.Name LIKE "%${name}%"   AND` : '';
        query += type != -1 ? ` Type LIKE "%${type}%"   AND` : '';
        query += priceMin ? ` Price >= ${priceMin}   AND` : '';
        query += priceMax ? ` Price <= ${priceMax}   AND` : '';

        query = query.substring(0, query.length - 6);

        tx.executeSql(query, [], transactionSuccess, transactionError);
        console.log(query)

        function transactionSuccess(tx, result) {
            console.log(`Search properties successfully.`);

            displayList(result.rows);

            $('#page-list #frm-search').trigger('reset');
            $('#page-list #frm-search').popup('close');
        }
    });
}

function convertType(typeId) {
    var result;
    if(typeId == 1) {result = "Penthouse"}
    else if(typeId == 2) {result = "Apartment"}
    else if(typeId == 3) {result = "Homestay"}
    return result;
}

//Display search result
function displayList(list) {
    var propertyList = `<ul id='list-property' data-role='listview' class='ui-nodisc-icon ui-alt-icon'>`;

    propertyList += list.length == 0 ? '<li><h2>There is no property.</h2></li>' : '';

    for (let property of list) {
        propertyList +=
            `<li><a data-details='{"Id" : ${property.Id}}'>
            <h2 style='margin-bottom: 0px;'>${property.Name}</h2>
            <p style='margin-top: 2px; margin-bottom: 10px;'><small>${property.City}</small></p>
            
            <div>
                <strong style='font-size: 13px;'>${property.Bedroom}<strong>
                
                &nbsp;&nbsp;
                
                <strong style='font-size: 13px;'>${property.Type}<strong>
                
                &nbsp;&nbsp;
                
                <strong style='font-size: 13px;'>${property.Price.toLocaleString('en-US')} VNĐ / month<strong>
            </div>
        </a></li>`;
    }
    propertyList += `</ul>`;

    $('#list-property').empty().append(propertyList).listview('refresh').trigger('create');

    console.log(`Show list of properties successfully.`);
}