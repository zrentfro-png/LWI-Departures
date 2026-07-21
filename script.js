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

                <td>${flight["BOARDING TIME:"] || ""}</td>

                <td>${flight["DEPARTURE TIME:"] || ""}</td>

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



// CLOCK

function updateClock(){

    const clock = document.getElementById("clock");

    if(clock){

        clock.textContent =
        new Date().toLocaleTimeString([], {
            hour:"numeric",
            minute:"2-digit"
        });

    }

}


updateClock();

setInterval(updateClock,1000);



// LOAD FLIGHTS

loadFlights();


// AUTO UPDATE FROM GOOGLE SHEET

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



// STOP AUTO SCROLL WHEN MANUALLY SCROLLING

if(board){

    board.addEventListener("wheel",()=>{

        autoScroll = false;


        setTimeout(()=>{

            autoScroll = true;

        },5000);

    });

}
