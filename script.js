const API = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRAw3GPVOLphzjelcLJGu_NJNEVYmumy5qom0K-TDpVXYPqk5IgfpVu9ruDGNJ7yEqqcpd7EPf8y2Xv7nZk2NjgjzEXjFP7Vmcs23sxP7NMqaEqQIOVtZhOixQMucVLAsF28KUeUq54yMR8s7v0vcewBhPQ5RFSnW7iSozfiW1IPlOhTIp7BQUTAW99aEP7xbDkHPCii4MQDgc6hpM51qy31xoudCKkmaEeGuckp5epJ93x3mD07VoAx3Iy2MRpARkJFMId8dezcu0HgPQ9uMmg8LapwQ&lib=Mxt-baddJceS0L-iRd-R-8E_9C8zt4dUy";

// Accepts "3:45 PM", "3:45PM", "03:45 pm", etc. and returns a Date
// object for today at that time, or null if it can't be parsed.
function parseTime(time) {

    if (!time) return null;

    const match = time.trim().match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])/);
    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    const d = new Date();
    d.setHours(hour, minute, 0, 0);

    return d;
}

// Rolling display window: hide flights that departed more than 30
// minutes ago, and don't show flights more than 2 hours out yet.
// Recalculated every refresh, so the window slides forward on its own.
const FALL_OFF_MS = 30 * 60 * 1000;      // 30 minutes in the past
const LOOK_AHEAD_MS = 2 * 60 * 60 * 1000; // 2 hours in the future

function isInDisplayWindow(departureTime) {

    const departure = parseTime(departureTime);

    // If we can't parse a departure time, show it rather than hide it
    // (better to see a flight with a data problem than have it vanish).
    if (!departure) return true;

    const diff = departure.getTime() - Date.now();

    return diff >= -FALL_OFF_MS && diff <= LOOK_AHEAD_MS;
}

// Map each airline name (exactly as it appears in the sheet, lowercase)
// to a logo file in your /logos folder. Add a new line here every time
// you add a new logo image. Airlines not listed just show as text.
const LOGO_VERSION = 2; // bump this number any time you replace a logo image
const AIRLINE_LOGOS = {
    "united": "logos/united.png",
    "avelo": "logos/avelo.png",
    "american": "logos/american.png",
    "jetblue": "logos/jetblue.png",
    "alaska": "logos/alaska.png",
    "southwest": "logos/southwest.png",
    "breeze": "logos/breeze.png",
    "delta": "logos/delta.png",
    "frontier": "logos/frontier.png",
    "spirit": "logos/spirit.png",
    "allegiant": "logos/allegiant.png",
    "sun country": "logos/sun-country.png",
    "hawaiian": "logos/hawaiian.png"
};

function renderAirline(airlineName) {

    const name = (airlineName || "").trim();
    const key = name.toLowerCase();
    const logo = AIRLINE_LOGOS[key];

    if (logo) {
       return `<img src="${logo}?v=${LOGO_VERSION}" alt="${name}" class="airline-logo">`;
    }

    return name;
}

async function loadFlights() {

    try {

        const response = await fetch(API);
        const flights = await response.json();

        const board = document.getElementById("flights");
        board.innerHTML = "";

        flights
        .filter(flight => isInDisplayWindow(flight["DEPARTURE TIME:"]))
        .forEach(flight => {

            const status = getStatus(
                flight["STATUS:"] || "",
                flight["BOARDING TIME:"],
                flight["DEPARTURE TIME:"]
            );

            const statusClass = status
                .replace(/\s+/g, "-")
                .toUpperCase();

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${renderAirline(flight["AIRLINE"])}</td>
                <td><b>${flight["FLIGHT NUMBER"] || ""}</b></td>
                <td>${flight["TO:"] || ""}</td>
                <td>${flight["GATE:"] || ""}</td>
                <td>${flight["BOARDING TIME:"] || ""}</td>
                <td>${flight["DEPARTURE TIME:"] || ""}</td>
                <td class="${statusClass}">${status}</td>
            `;

            board.appendChild(row);

        });

    } catch (error) {

        console.log("FIDS ERROR:", error);

    }

}

// Statuses that can be typed directly into the STATUS column in the
// Google Sheet. If the cell matches one of these (case-insensitive),
// it is shown exactly as-is and the automatic time-based logic below
// is skipped entirely. Leave the cell BLANK or type "Auto" to let the
// script calculate the status from the boarding/departure times.
const MANUAL_STATUSES = {
    "cancelled": "Cancelled",
    "delayed": "Delayed",
    "on time": "On Time",
    "boarding": "Boarding",
    "final call": "Final Call",
    "departing": "Departing",
    "departed": "Departed",
    "gate closed": "Gate Closed",
    "diverted": "Diverted"
};

function getStatus(sheetStatus, boardingTime, departureTime) {

    const raw = (sheetStatus || "").trim();
    const key = raw.toLowerCase();

    // --- MANUAL OVERRIDE ---
    // Anything in the sheet that matches a known status (other than
    // blank/"auto") wins immediately, no time math involved.
    if (key && key !== "auto" && MANUAL_STATUSES[key]) {
        return MANUAL_STATUSES[key];
    }

    // --- AUTOMATIC TIME-BASED STATUS ---
    if (!departureTime) return "On Time";

    const now = new Date();

    const boarding = parseTime(boardingTime);
    const departure = parseTime(departureTime);

    if (!departure) return "On Time";

    const boardingTimeMs = boarding ? boarding.getTime() : null;
    const finalCallTime = departure.getTime() - (10 * 60 * 1000);
    const departedTime = departure.getTime() + (15 * 60 * 1000);

    if (now.getTime() >= departedTime)
        return "Departed";

    if (now.getTime() >= departure.getTime())
        return "Departing";

    if (now.getTime() >= finalCallTime)
        return "Final Call";

    if (boarding && now.getTime() >= boardingTimeMs)
        return "Boarding";

    return "On Time";
}

// CLOCK

function updateClock() {

    const clock = document.getElementById("clock");

    if (clock) {

        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });

    }

}

updateClock();
setInterval(updateClock, 1000);

// LOAD FLIGHTS

loadFlights();
setInterval(loadFlights, 15000);

// AUTO SCROLL

let autoScroll = true;
let holding = false; // true while paused at the top or bottom

const HOLD_MS = 4000; // how long to sit at the bottom/top before moving again

const board = document.querySelector(".board");

setInterval(() => {

    if (!autoScroll || !board || holding) return;

    const atBottom = board.scrollTop >= board.scrollHeight - board.clientHeight;

    if (atBottom) {

        holding = true;

        setTimeout(() => {
            board.scrollTop = 0;
            holding = false;
        }, HOLD_MS);

        return;

    }

    board.scrollTop += 1;

}, 50);

// Pause scrolling while user scrolls

if (board) {

    board.addEventListener("wheel", () => {

        autoScroll = false;

        clearTimeout(board.scrollTimeout);

        board.scrollTimeout = setTimeout(() => {
            autoScroll = true;
        }, 5000);

    });

}
