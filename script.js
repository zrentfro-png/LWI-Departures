/* =====================================================
   LAWRENCE WICKHAM INTERNATIONAL AIRPORT
   FLIGHT INFORMATION SYSTEM
===================================================== */


/* =====================================================
   GOOGLE SHEETS API
===================================================== */

const API =
    "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRAw3GPVOLphzjelcLJGu_NJNEVYmumy5qom0K-TDpVXYPqk5IgfpVu9ruDGNJ7yEqqcpd7EPf8y2Xv7nZk2NjgjzEXjFP7Vmcs23sxP7NMqaEqQIOVtZhOixQMucVLAsF28KUeUq54yMR8s7v0vcewBhPQ5RFSnW7iSozfiW1IPlOhTIp7BQUTAW99aEP7xbDkHPCii4MQDgc6hpM51qy31xoudCKkmaEeGuckp5epJ93x3mD07VoAx3Iy2MRpARkJFMId8dezcu0HgPQ9uMmg8LapwQ&lib=Mxt-baddJceS0L-iRd-R-8E_9C8zt4dUy";


/* =====================================================
   SETTINGS
===================================================== */

const FALL_OFF_MS =
    30 * 60 * 1000;

const LOOK_AHEAD_MS =
    2 * 60 * 60 * 1000;

const REFRESH_MS =
    15 * 1000;

const HOLD_MS =
    4000;


/* =====================================================
   AIRLINE LOGOS
===================================================== */

const LOGO_VERSION = 5;

const AIRLINE_LOGOS = {

    "united":
        "logos/united.png",

    "avelo":
        "logos/avelo.png",

    "american":
        "logos/americanaa.png",

    "jetblue":
        "logos/jetblue.png",

    "alaska":
        "logos/alaska.png",

    "southwest":
        "logos/southwest.png",

    "breeze":
        "logos/breeze.png",

    "delta":
        "logos/delta.png",

    "frontier":
        "logos/frontier.png",

    "spirit":
        "logos/spirit.png",

    "allegiant":
        "logos/allegiant.png",

    "sun country":
        "logos/sun-country.png",

    "hawaiian":
        "logos/hawaiian.png"
};


/* =====================================================
   MANUAL STATUSES
===================================================== */

const MANUAL_STATUSES = {

    "cancelled":
        "Cancelled",

    "delayed":
        "Delayed",

    "on time":
        "On Time",

    "boarding":
        "Boarding",

    "final call":
        "Final Call",

    "departing":
        "Departing",

    "departed":
        "Departed",

    "gate closed":
        "Gate Closed",

    "diverted":
        "Diverted"
};


/* =====================================================
   TIME PARSER
===================================================== */

function parseTime(time) {

    if (!time) {
        return null;
    }


    const match =
        String(time)
            .trim()
            .match(
                /(\d{1,2}):(\d{2})\s*([AaPp][Mm])/
            );


    if (!match) {
        return null;
    }


    let hour =
        Number(match[1]);

    const minute =
        Number(match[2]);

    const ampm =
        match[3].toUpperCase();


    if (
        ampm === "PM" &&
        hour !== 12
    ) {
        hour += 12;
    }


    if (
        ampm === "AM" &&
        hour === 12
    ) {
        hour = 0;
    }


    const date =
        new Date();


    date.setHours(
        hour,
        minute,
        0,
        0
    );


    return date;
}


/* =====================================================
   DISPLAY WINDOW
===================================================== */

function isInDisplayWindow(
    departureTime
) {

    const departure =
        parseTime(departureTime);


    if (!departure) {
        return true;
    }


    const difference =
        departure.getTime() -
        Date.now();


    return (
        difference >= -FALL_OFF_MS &&
        difference <= LOOK_AHEAD_MS
    );
}


/* =====================================================
   STATUS CALCULATION
===================================================== */

function getStatus(
    sheetStatus,
    boardingTime,
    departureTime
) {

    const raw =
        String(sheetStatus || "")
            .trim();


    const key =
        raw.toLowerCase();


    /* MANUAL OVERRIDE */

    if (
        key &&
        key !== "auto" &&
        MANUAL_STATUSES[key]
    ) {

        return MANUAL_STATUSES[key];
    }


    /* AUTOMATIC */

    if (!departureTime) {
        return "On Time";
    }


    const now =
        new Date();


    const boarding =
        parseTime(boardingTime);


    const departure =
        parseTime(departureTime);


    if (!departure) {
        return "On Time";
    }


    const finalCallTime =
        departure.getTime() -
        10 * 60 * 1000;


    const departedTime =
        departure.getTime() +
        15 * 60 * 1000;


    if (
        now.getTime() >=
        departedTime
    ) {

        return "Departed";
    }


    if (
        now.getTime() >=
        departure.getTime()
    ) {

        return "Departing";
    }


    if (
        now.getTime() >=
        finalCallTime
    ) {

        return "Final Call";
    }


    if (
        boarding &&
        now.getTime() >=
        boarding.getTime()
    ) {

        return "Boarding";
    }


    return "On Time";
}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(value) {

    return String(value ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =====================================================
   AIRLINE
===================================================== */

function renderAirline(
    airlineName
) {

    const name =
        String(airlineName || "")
            .trim();


    const key =
        name.toLowerCase();


    const logo =
        AIRLINE_LOGOS[key];


    if (!logo) {

        return `
            <div class="airline-name">
                ${escapeHTML(name)}
            </div>
        `;
    }


    return `

        <img
            src="${logo}?v=${LOGO_VERSION}"
            alt="${escapeHTML(name)}"
            class="airline-logo">

    `;
}


/* =====================================================
   STATUS CLASS
===================================================== */

function getStatusClass(status) {

    return String(status)

        .trim()

        .replace(
            /\s+/g,
            "-"
        )

        .toUpperCase();
}


/* =====================================================
   UPDATE ALL-DAY COUNTERS
===================================================== */

function updateCounters(
    flights
) {

    let total =
        flights.length;

    let onTime = 0;

    let delayed = 0;

    let cancelled = 0;

    let boarding = 0;


    /*
       IMPORTANT:

       We use the ENTIRE flights array here.

       We do NOT use the rolling
       display window.
    */


    flights.forEach(
        flight => {

            const status =
                getStatus(
                    flight["STATUS:"],
                    flight["BOARDING TIME:"],
                    flight["DEPARTURE TIME:"]
                );


            const normalized =
                status
                    .trim()
                    .toLowerCase();


            if (
                normalized ===
                "on time"
            ) {

                onTime++;
            }


            if (
                normalized ===
                "delayed"
            ) {

                delayed++;
            }


            if (
                normalized ===
                "cancelled"
            ) {

                cancelled++;
            }


            if (
                normalized ===
                "boarding"
            ) {

                boarding++;
            }

        }
    );


    const totalElement =
        document.getElementById(
            "totalFlights"
        );


    const onTimeElement =
        document.getElementById(
            "onTimeFlights"
        );


    const delayedElement =
        document.getElementById(
            "delayedFlights"
        );


    const cancelledElement =
        document.getElementById(
            "cancelledFlights"
        );


    const boardingElement =
        document.getElementById(
            "boardingFlights"
        );


    if (totalElement) {

        totalElement.textContent =
            total;
    }


    if (onTimeElement) {

        onTimeElement.textContent =
            onTime;
    }


    if (delayedElement) {

        delayedElement.textContent =
            delayed;
    }


    if (cancelledElement) {

        cancelledElement.textContent =
            cancelled;
    }


    if (boardingElement) {

        boardingElement.textContent =
            boarding;
    }
}


/* =====================================================
   CREATE FLIGHT CARD
===================================================== */

function createFlightCard(
    flight
) {

    const status =
        getStatus(
            flight["STATUS:"],
            flight["BOARDING TIME:"],
            flight["DEPARTURE TIME:"]
        );


    const statusClass =
        getStatusClass(status);


    const airline =
        flight["AIRLINE"] || "";


    const flightNumber =
        flight["FLIGHT NUMBER"] || "";


    const destination =
        flight["TO:"] || "";


    const gate =
        flight["GATE:"] || "—";


    const departure =
        flight["DEPARTURE TIME:"] || "—";


    let destinationName =
        String(destination);


    let destinationCode =
        "";


    /*
       Supports:
       Dallas (DFW)
       Kansas City (MCI)
       Denver - DEN
    */

    const match =
        destinationName.match(
            /^(.*?)[\s\-]*\(([A-Za-z0-9]{3,4})\)$/
        );


    if (match) {

        destinationName =
            match[1].trim();

        destinationCode =
            match[2].toUpperCase();
    }


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "flight-card";


    card.innerHTML = `

        <div class="flight-airline">

            ${renderAirline(airline)}

        </div>


        <div class="flight-number">

            ${escapeHTML(
                flightNumber
            )}

        </div>


        <div class="destination">

            <div class="destination-main">

                ${escapeHTML(
                    destinationName
                )}

            </div>

            ${
                destinationCode
                    ? `
                        <div class="destination-code">
                            ${escapeHTML(
                                destinationCode
                            )}
                        </div>
                    `
                    : ""
            }

        </div>


        <div class="flight-gate">

            <span>
                GATE
            </span>

            <strong>
                ${escapeHTML(gate)}
            </strong>

        </div>


        <div class="flight-time">

            <span>
                DEPARTURE
            </span>

            <strong>
                ${escapeHTML(departure)}
            </strong>

        </div>


        <div class="flight-status">

            <span
                class="status ${statusClass}">

                ${escapeHTML(status)}

            </span>

        </div>

    `;


    return card;
}


/* =====================================================
   LOAD FLIGHTS
===================================================== */

async function loadFlights() {

    try {

        const response =
            await fetch(
                API,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const flights =
            await response.json();


        if (
            !Array.isArray(flights)
        ) {

            throw new Error(
                "Google Sheet API did not return an array."
            );
        }


        /*
           ================================================
           ALL-DAY COUNTERS

           This receives ALL flights.
           ================================================
        */

        updateCounters(
            flights
        );


        /*
           ================================================
           ROLLING DISPLAY

           Only this portion is filtered.
           ================================================
        */

        const visibleFlights =
            flights.filter(
                flight =>
                    isInDisplayWindow(
                        flight[
                            "DEPARTURE TIME:"
                        ]
                    )
            );


        const board =
            document.getElementById(
                "flights"
            );


        const noFlights =
            document.getElementById(
                "noFlights"
            );


        if (!board) {
            return;
        }


        board.innerHTML = "";


        if (
            visibleFlights.length === 0
        ) {

            if (noFlights) {

                noFlights.style.display =
                    "flex";
            }

            return;
        }


        if (noFlights) {

            noFlights.style.display =
                "none";
        }


        visibleFlights.forEach(
            flight => {

                board.appendChild(
                    createFlightCard(
                        flight
                    )
                );

            }
        );


    } catch (error) {

        console.error(
            "FIDS ERROR:",
            error
        );

    }
}


/* =====================================================
   CLOCK
===================================================== */

function updateClock() {

    const clock =
        document.getElementById(
            "clock"
        );


    if (!clock) {
        return;
    }


    clock.textContent =
        new Date().toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
}


/* =====================================================
   DATE
===================================================== */

function updateDate() {

    const element =
        document.getElementById(
            "today"
        );


    if (!element) {
        return;
    }


    element.textContent =
        new Date().toLocaleDateString(
            [],
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );
}


/* =====================================================
   GREETING
===================================================== */

function updateGreeting() {

    const heading =
        document.querySelector(
            ".hero h1"
        );


    if (!heading) {
        return;
    }


    const hour =
        new Date().getHours();


    if (hour < 12) {

        heading.textContent =
            "Good morning.";

    } else if (hour < 17) {

        heading.textContent =
            "Good afternoon.";

    } else {

        heading.textContent =
            "Good evening.";
    }
}


/* =====================================================
   AUTO SCROLL
===================================================== */

let autoScroll = true;

let holding = false;

let scrollTimeout = null;


const flightList =
    document.querySelector(
        ".flight-list"
    );


function startAutoScroll() {

    if (!flightList) {
        return;
    }


    setInterval(
        () => {

            if (
                !autoScroll ||
                holding
            ) {

                return;
            }


            const atBottom =
                flightList.scrollTop >=
                flightList.scrollHeight -
                flightList.clientHeight -
                2;


            if (atBottom) {

                holding = true;


                setTimeout(
                    () => {

                        flightList.scrollTo({
                            top: 0,
                            behavior:
                                "smooth"
                        });


                        holding = false;

                    },
                    HOLD_MS
                );


                return;
            }


            flightList.scrollTop += 1;

        },
        60
    );
}


/* =====================================================
   PAUSE AUTO SCROLL WHEN USER USES LIST
===================================================== */

if (flightList) {

    flightList.addEventListener(
        "wheel",
        () => {

            autoScroll = false;


            clearTimeout(
                scrollTimeout
            );


            scrollTimeout =
                setTimeout(
                    () => {

                        autoScroll = true;

                    },
                    5000
                );

        }
    );


    flightList.addEventListener(
        "touchstart",
        () => {

            autoScroll = false;

            clearTimeout(
                scrollTimeout
            );

        },
        {
            passive: true
        }
    );


    flightList.addEventListener(
        "touchend",
        () => {

            clearTimeout(
                scrollTimeout
            );


            scrollTimeout =
                setTimeout(
                    () => {

                        autoScroll = true;

                    },
                    5000
                );

        }
    );
}


/* =====================================================
   START
===================================================== */

updateClock();

updateDate();

updateGreeting();


setInterval(
    updateClock,
    1000
);


setInterval(
    updateGreeting,
    60000
);


loadFlights();


setInterval(
    loadFlights,
    REFRESH_MS
);


startAutoScroll();
