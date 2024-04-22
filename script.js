// Initialize the map at Toronto        
let map = L.map('map').setView([43.642, -79.389], 15);

// Add a title layer and set the zoom level
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Technical Assignment &copy; <a href="https://www.linkedin.com/in/zaeem-maqsood/">Zaeem Maqsood</a>',
    maxZoom: 18,
}).addTo(map);

// ------------- Task 1 - Create new points, lines or areas ----------------
// Create a feature group for editable layers
let editableLayers = new L.FeatureGroup();

//  Add this feature group to the map then add the draw controls
editableLayers.addTo(map);

let options = {
    position: 'topright',
    draw: {
        polyline: true,
        polygon: true,
        rectangle: true,
        circle: true,
        marker: true,
    },
    // Task 2 and 3 - Edit and Delete Features
    // This allows us to edit the drawn features and 
    // remove them using the delete button
    edit: {
        featureGroup: editableLayers,
        remove: true
    }
};

let drawControl = new L.Control.Draw(options);
map.addControl(drawControl);

// ------------- Task 4 - Add multi line text to the drawn features ----------------

// Dictionary to store data associations with features
let featureTextAssociations = {};

let currentLayer = null;

map.on(L.Draw.Event.CREATED, function (e) {
    currentLayer = e.layer;

    // Add a click event to the layer to display data
    currentLayer.on('click', function (e) {
        const featureId = L.stamp(e.target);
        console.log(featureTextAssociations[featureId])
        const content = featureTextAssociations[featureId].content;
        const lat = featureTextAssociations[featureId].lat;
        const lng = featureTextAssociations[featureId].lng;
        $('#featureText').html('<p class="text-sm mb-2">' + 'Content: ' + content + '</p>' + '<p class="text-sm mb-2">Lat: ' + lat + ', Lng: ' + lng + '</p>');
    });
    document.getElementById("textModal").style.display = "flex";
});

function saveText() {
    let content = $('#multilineText').val();
    if (currentLayer) {
        
        // Get unique identifier for each feature
        let featureId = L.stamp(currentLayer);

        // Save Text, lat and lng to the featureTextAssociations dictionary
        let lat = currentLayer.getLatLng().lat;
        let lng = currentLayer.getLatLng().lng;
        let latLng = currentLayer.getLatLng();
        let info = {"content": content, "lat": lat, "lng": lng, "latLng": latLng};
        featureTextAssociations[featureId] = info;

        // Add the layer to the map
        editableLayers.addLayer(currentLayer);

        let featureText = $('#featureText').html();
        featureText += '<p>' + content + '</p>';
        addHistory(featureId, "Created");
    }
    closeModal();
}

function closeModal() {
    $('#multilineText').val('');
    document.getElementById("textModal").style.display = "none";
    currentLayer = null;
}

editableLayers.on('click', function (e) {
    currentLayer = e.layer;
    console.log('Current Layer', currentLayer);
});

// ------------- Task 5 - Search for features ----------------
function searchFeatures() {

    // Clear the search results div
    $('#searchResults').html('');

    let searchText = $('#searchInput').val().toLowerCase();
    let found = false;

    // Get current history and remove any existing highlights
    let history = $('#history').html();
    let clearHighlights = history.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1'); // Remove existing <span> tags
    $('#history').html(clearHighlights); // Update the history content without highlights


    if (searchText === "") {
        alert("Please enter a search term.");
    }
    else {
        // Highlight search in history
        let history = $('#history').html();
        let regex = new RegExp(`(${searchText})`, 'gi'); // Create a case-insensitive regex
        let highlightedHistory = history.replace(regex, '<span style="background-color: yellow;">$1</span>'); // Highlight the term
        $('#history').html(highlightedHistory); // Update the history content

        let searchResults = []

        Object.keys(featureTextAssociations).forEach(function (featureId) {
            if (featureTextAssociations[featureId].content.toLowerCase().includes(searchText)) {
                // Find the corresponding layer in editableLayers
                // Add featureTEXT to the searchResults array
                searchResults.push(featureTextAssociations[featureId]);
                found = true; // Set flag to indicate a match was found
            }
        });
    
        if (found) {
            $('#searchResultsDiv').show();
            // Loop through the search results and display them
            $('#searchResults').empty();
            searchResults.forEach((result) => {
                console.log(result);    
                $('#searchResults').append('<p onclick="viewOnMap(' + result.lat + ',' + result.lng + ')" ' +  'class="text-sm mb-2">' + result.content + ' (Click To View On Map)' + '</p>');
            });
        }
        else {
            alert("No matching features found.");
        }

    }

}

function viewOnMap(lat, lng) {
    let latLng = L.latLng(lat, lng);
    map.setView(latLng, 18);
}


// ------------- For Fun - Added a history view ----------------
// History of edited or deleted features
map.on('draw:edited draw:deleted', function (e) {
    let layers = e.layers;
    console.log('Layers', layers);

    // Get event type 
    let eventType = e.type.split(':')[1];
    console.log('Edited or deleted', eventType);
    layers.eachLayer(function(layer) {

        if (eventType === "deleted") {
            // Delete the feature from the featureTextAssociations dictionary
            let featureId = L.stamp(layer);
            addHistory(featureId, eventType);
            delete featureTextAssociations[featureId];
        }
        else {
            addHistory(layer, eventType);
        }

    });
    console.log('Feature Text Associations', featureTextAssociations);
});

function addHistory(featureId, eventType) {
    let history = $('#history').html();
    let historyContent = "";

    if (eventType === "deleted") {
        // Get layer content, and other data and add to the history
        historyContent = eventType + ": " + featureTextAssociations[featureId].content;
        $('#history').html(history + '<p class="text-sm mb-2">' + historyContent + '</p>');
        return;
    }
    else {
        const lat = featureTextAssociations[featureId].lat;
        const lng = featureTextAssociations[featureId].lng;
        historyContent = eventType + ": " + featureTextAssociations[featureId].content + "<br>" + "Lat: " + lat + ", Lng: " + lng;
    }
    
    $('#history').html(history + '<p class="text-sm mb-2">' + historyContent + '</p>');
}


// =================== Part 2 ===============================

// Implementing the change to allow for multiple text blocks to be associated with a block of text and to allow for multiple text blocks to be associated with a feature
// Involves several steps:

// 1. The way text blocks are stored needs to change. 
//      Currently we are storing the text blocks (and lat lng data) directly on the featureTextAssociations dictionary.
//      I would create a new data structure to store the text block.
//      This new data structure would also contain some sort of unique identifier for the text block.
//      i.e {textId: 1, content: "Some text"}
//      Now that the text blocks are in their own data structure we can create relationships between them and features.


// 2. Create a new data structure that stores the relationship between features and text blocks
//      This data structure would store the featureId's like we are already doing except now it would store an array of textId's as well.
//      i.e {featureId: 1, textIds: [1, 2, 3]}


// 3. Create a new data structure that would store the relationship between text blocks and features
//      This data structure would store the textId's and store an array of featureId's as well.
//      i.e {textId: 1, featureIds: [1, 2, 3]}


// 4. Update how text blocks are saved and associated with features
//      Now that we have our data structures in place, we can update the saveText function to create a new text block and associate it with a feature.
//      The only difference would be that now we can allow the user to enter multiple text blocks instead of only 1.


// 5. Update how text blocks are displayed when a feature is clicked
//      When a feature is clicked we need to display all the text blocks associated with that feature instead of just the 1 text block before.


// 6. Ability to add create text blocks and associate a feature with them
//      We need to add a way for the user to create text blocks and associate features with them. This could be some form 
//      that directly ask for relationships between existing features and text blocks.


// 7. A new view to click on text boxes and view the associated features
//      Similar to how we can click on features and view the associated text blocks, we should be able to click on text blocks and view the associated features.


// =================== Part 3 ===============================

// I have been a Python/Django Full-Stack developer for the last 10 years now and have worked on many different projects. 
// My sister is becoming a doctor and has worked on many indigenous reserves and rural parts of Canada, where access to healthcare is limited. 
// I can imagine that the problems extend to other areas such as housing. It would be great to work on a project that helps these communities 
// and give back in ways that I can be most effective.
