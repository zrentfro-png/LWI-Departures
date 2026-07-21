const API = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRAw3GPVOLphzjelcLJGu_NJNEVYmumy5qom0K-TDpVXYPqk5IgfpVu9ruDGNJ7yEqqcpd7EPf8y2Xv7nZk2NjgjzEXjFP7Vmcs23sxP7NMqaEqQIOVtZhOixQMucVLAsF28KUeUq54yMR8s7v0vcewBhPQ5RFSnW7iSozfiW1IPlOhTIp7BQUTAW99aEP7xbDkHPCii4MQDgc6hpM51qy31xoudCKkmaEeGuckp5epJ93x3mD07VoAx3Iy2MRpARkJFMId8dezcu0HgPQ9uMmg8LapwQ&lib=Mxt-baddJceS0L-iRd-R-8E_9C8zt4dUy";


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
