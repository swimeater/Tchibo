class TrafficLane {
    constructor(id) {
        this.information = "N/A";
        this.durationInMinutes = 0;
        this.previousDurationInMinutes = 0;
        this.html = `
		<div data-id="${id}" class="mb-3">
			<hr>
			<div class="row mb-3">
				<div class="col-6">
					<div class="ml-3 input-group">
						<div class="custom-file">
							<input type="file" class="custom-file-input image-selector"  data-id="${id}"  id="image-selector-${id}" aria-describedby="customFileInput">
							<label class="custom-file-label text-white bg-info" for="image-selector-${id}">Select image</label>
						</div>
					</div>
					<div id="spinner-${id}" style="display: none">
						<div class="ml-3 mt-3 spinner-grow text-primary" role="status">
							<span class="sr-only">Processing...</span>
						</div>
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col-4">
					<h3 class="ml-3">Image</h3>
					<img id="selected-image-${id}" class="ml-3" width="250" alt=""> 
				</div>
				<div class="col-4">
					<h3 class="ml-3">Predictions</h3>
					<ol id="prediction-list-${id}"></ol>
				</div>
				<div class="col-4">
					<h3 class="ml-3">Possible Item</h3>
					<ol id="item-information-${id}">
					</ol>
				</div>
			</div>
			<hr>
		</div>
		`;
    }
    duration() {
        return 1000 * 60 * this.durationInMinutes;
    }
    difference() {
        return this.durationInMinutes - this.previousDurationInMinutes;
    }
}

let trafficLanes = [new TrafficLane(1)];

let imageLoaded = false;
$("#traffic-lanes").on("change", ".image-selector", function () {
    let id = $(this).data("id");
    // $("#spinner-" + id).hide();

    imageLoaded = false;
    let reader = new FileReader();
    console.log("id", id);
    reader.onload = function () {
        let $currentImage = $("#selected-image-" + id).get(0);
        $currentImage.onload = function () {
            $("#prediction-list-" + id).empty();
            triggerPrediction(id);
        };
        let dataURL = reader.result;
        $("#selected-image-" + id).attr("src", dataURL);
        imageLoaded = true;
    };

    let file = $(this).prop("files")[0];
    reader.readAsDataURL(file);
});

$("#traffic-lanes").on("click", ".image-selector", function () {
    let id = $(this).data("id");
    $("#spinner-" + id).show();
});

let model;
let modelLoaded = false;
$(document).ready(async function () {
    modelLoaded = false;
    $(".progress-bar").show();
    console.log("Loading model...");
    model = await tf.loadGraphModel("model/model.json");
    console.log("Model loaded.");
    $(".progress-bar").hide();
    modelLoaded = true;
    trafficLanes.forEach((trafficLane) => {
        $("#traffic-lanes").append(trafficLane.html);
    });
});

async function triggerPrediction(id) {
    if (!modelLoaded) {
        alert("The model must be loaded first");
        return;
    }
    // if (!imageLoaded) {
    //     alert("Please select an image first");
    //     return;
    // }

    let image = $("#selected-image-" + id).get(0);

    // Pre-process the image
    console.log("Loading image...");
    let tensor = tf.browser
        .fromPixels(image, 3)
        .resizeNearestNeighbor([224, 224]) // change the image size
        .expandDims()
        .toFloat()
        .reverse(1); // RGB -> BGR
    let predictions = await model.predict(tensor).data();
    console.log(predictions);
    let top5 = Array.from(predictions)
        .map(function (p, i) {
            // this is Array.map
            return {
                probability: p,
                className: TARGET_CLASSES[i], // we are selecting the value from the obj
            };
        })
        .sort(function (a, b) {
            return b.probability - a.probability;
        })
		.slice(0, 2);
	$("#spinner-" + id).hide();

    $("#prediction-list-" + id).empty();
    $("#item-information-" + id).empty();
    top5.forEach(function (p) {
        console.log("prediction", p);
        $("#prediction-list-" + id).append(
            `<li>${p.className}: ${p.probability.toFixed(6)}</li>`
        );
        if (p.className === "Dark") {
            determineTraffic(p.probability, parseInt(id) - 1);
            let trafficInfo = trafficLanes[parseInt(id) - 1];
            console.log("trafficInfo", trafficInfo);
            $("#item-information-" + id).append(
                `<li>${trafficInfo.information}</li>`
            );
        }
    });
    
}

function determineTraffic(trafficValue, id) {
    console.log("trafficValue", trafficValue);
    let trafficValuePercentage = parseFloat(trafficValue * 100).toFixed(4);
    console.log("trafficValuePercentage", trafficValuePercentage);
    let trafficInfo = trafficLanes[id];
    trafficInfo.previousDurationInMinutes = trafficInfo.durationInMinutes;

    if (trafficValuePercentage > 90) {
        trafficInfo.durationInMinutes = 5;
        trafficInfo.information = "<img src='https://www.tchibo.de/newmedia/art_img/MAIN_HD-IMPORTED/1faf4769f1ea9e5/privat-kaffee-african-blue-500-g-gemahlen.jpg' wight='250' height='250'>";
        // trafficLanes[0] = trafficInfo;
        return true;
    }
    if (trafficValuePercentage > 70) {
        trafficInfo.durationInMinutes = 4;
        trafficInfo.information = "<img src='https://www.tchibo.de/newmedia/art_img/MAIN_HD-IMPORTED/32b49febf1869e5/beste-bohne-9-x-500g-gemahlen.jpg' wight='250' height='250'>";
        // trafficLanes[0] = trafficInfo;
        return true;
    }
    if (trafficValuePercentage > 60) {
        trafficInfo.durationInMinutes = 3;
        trafficInfo.information = "<img src='https://www.tchibo.de/newmedia/art_img/MAIN_HD-IMPORTED/4f59febf1869e5/feine-milde-9-x-500g-gemahlen.jpg' wight='250' height='250'>";
        // trafficLanes[0] = trafficInfo;
        return true;
    }
    trafficInfo.durationInMinutes = 2;
    trafficInfo.information = "<img src='https://www.tchibo.de/newmedia/art_img/MAIN_HD-IMPORTED/685a9febf1869e5/sana-entkoffeiniert-9-x-500g-gemahlen.jpg' wight='250' height='250'>";
    // trafficLanes[0] = trafficInfo;
    return true;
}
