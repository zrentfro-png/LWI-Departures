const API = "PASTE YOUR GOOGLE SCRIPT URL HERE";


async function loadFlights(){

    try {

        const response = await fetch(API);

        const flights = await response.json();


        const board = document.getElementById("flights");

        board.innerHTML="";


        flights.sort((a,b)=>{

            return new Date(a["DEPARTURE TIME:"]) -
                   new Date(b["DEPARTURE TIME:"]);

        });



        flights.forEach(flight=>{


            let status =
            flight["STATUS:"] || "On Time";


            let statusClass =
            status.replaceAll(" ","-").toUpperCase();



            let row=document.createElement("tr");


            row.innerHTML=`

            <td>${flight["AIRLINE"] || ""}</td>

            <td><b>${flight["FLIGHT NUMBER"]}</b></td>

            <td>${flight["TO:"]}</td>

            <td>${flight["GATE:"]}</td>

            <td>${convertTime(flight["BOARDING TIME"])}</td>

            <td>${convertTime(flight["DEPARTURE TIME:"])}</td>

            <td class="${statusClass}">
            ${status}
            </td>

            `;


            board.appendChild(row);


        });


    }

    catch(error){

        console.log("FIDS ERROR:",error);

    }

}



function convertTime(value){

    if(!value) return "";

    let date=new Date(value);


    return date.toLocaleTimeString([],{

        hour:"numeric",

        minute:"2-digit"

    });

}



function updateClock(){

    document.getElementById("clock").innerHTML =
    new Date().toLocaleTimeString([],{

        hour:"numeric",

        minute:"2-digit"

    });

}



setInterval(updateClock,1000);

updateClock();


loadFlights();


// Updates automatically from Google Sheets

setInterval(loadFlights,15000);
