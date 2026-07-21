const API = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRAw3GPVOLphzjelcLJGu_NJNEVYmumy5qom0K-TDpVXYPqk5IgfpVu9ruDGNJ7yEqqcpd7EPf8y2Xv7nZk2NjgjzEXjFP7Vmcs23sxP7NMqaEqQIOVtZhOixQMucVLAsF28KUeUq54yMR8s7v0vcewBhPQ5RFSnW7iSozfiW1IPlOhTIp7BQUTAW99aEP7xbDkHPCii4MQDgc6hpM51qy31xoudCKkmaEeGuckp5epJ93x3mD07VoAx3Iy2MRpARkJFMId8dezcu0HgPQ9uMmg8LapwQ&lib=Mxt-baddJceS0L-iRd-R-8E_9C8zt4dUy";


async function loadFlights(){

    try {

        const response = await fetch(API);

        const flights = await response.json();

        const board = document.getElementById("flights");

        board.innerHTML = "";


        flights.forEach(flight => {

            let status = flight["STATUS:"] || "On Time";


            let statusClass = status
                .replace(/\s+/g, "-")
                .toUpperCase();


            let row = document.createElement("tr");


            row.innerHTML = `

                <td>${flight["AIRLINE"] || ""}</td>

                <td><b>${flight["FLIGHT NUMBER"] || ""}</b></td>

                <td>${flight["TO:"] || ""}</td>

                <td>${flight["GATE:"] || ""}</td>

                <td>${formatTime(flight["BOARDING TIME"])}</td>

                <td>${formatTime(flight["DEPARTURE TIME:"])}</td>

                <td class="${statusClass}">
                    ${status}
                </td>

            `;


            board.appendChild(row);

        });


    } catch(error){

        console.log("FIDS ERROR:", error);

    }

}



// Converts Google Sheet time into FIDS format
function formatTime(value){

    if(!value){
        return "";
    }


    value = String(value).trim();


    // Example: 2:00:00 AM
    let parts = value.split(" ");


    let time = parts[0];

    let ampm = parts[1] || "";


    let numbers = time.split(":");


    let hour = numbers[0];

    let minute = numbers[1];


    return `${hour}:${minute} ${ampm}`;

}



// CLOCK

function updateClock(){

    const clock = document.getElementById("clock");

    if(clock){

        clock.innerHTML =
        new Date().toLocaleTimeString([], {
            hour:"numeric",
            minute:"2-digit"
        });

    }

}


setInterval(updateClock,1000);

updateClock();



// LOAD FLIGHTS

loadFlights();



// AUTO UPDATE EVERY 15 SECONDS

setInterval(loadFlights,15000);



// AUTO SCROLL

let autoScroll = true;

const board = document.querySelector(".board");


setInterval(()=>{

    if(autoScroll && board){

        board.scrollTop += 1;


        if(board.scrollTop >= board.scrollHeight - board.clientHeight){

            board.scrollTop = 0;

        }

    }

},50);



// PAUSE AUTO SCROLL WHEN USER SCROLLS

if(board){

    board.addEventListener("wheel",()=>{

        autoScroll = false;


        setTimeout(()=>{

            autoScroll = true;

        },5000);

    });

}
