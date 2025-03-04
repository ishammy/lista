import React, { useEffect, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {gapi} from "gapi-script"
import * as Ons from "react-onsenui";
import LoginButton from "./components/login"
import LogoutButton from "./components/logout"
import "onsenui/css/onsenui.css";
import "onsenui/css/onsen-css-components.css";

import aes from 'crypto-js/aes';

const spreadsheetID = "1SI1vuW0HQUveqiKPT1Jjr_A471W02Co0OXVcp2zyeO0";
let sheetName = ""  // SHEET NAME
let sheetID = 0;  // SHEET ID
const CLIENT_ID=
const API_KEY=
const SCOPES="https://www.googleapis.com/auth/spreadsheets"
// Our main component
const App = () => {
    useEffect(() =>{
        function start(){ 
            gapi.client.init({
                apiKey: API_KEY, 
                clientId: CLIENT_ID, 
                scope: SCOPES
            })
        };
        gapi.load('client:auth2', start)
    })
    // Name, guild, and section states that updates everytime QR Code is scanned
    let [name, setName] = useState("");
    let [studentNumber, setStudentNumber] = useState("");
    let [guild, setGuild] = useState("");
    let [section, setSection] = useState("");

    let [sideMenuOpen, setSideMenuOpen] = useState(false);
    let [hasScanned, setHasScanned] = useState(false);

    // Separate name, guild, and section and return it as different variables
    let parseResult = (qrcodeContent) => {
        let splitted = qrcodeContent.split(" [|] ");  // QR Code content example: Dela Cruz, Juan A. [|] Student No. [|] IREDOC [|] STEM1201
        return {
            name: splitted[0],
            studentNumber: splitted[1],
            guild: splitted[2],
            section: splitted[3],
        };
    };

    const LISTOGuilds = [ "IREDOC", "SWES", "ETIKA", "NUMERIKA", "LETRA" ];
    const GILASGuilds = [ "AWIT", "GALAW", "INSTRUMENTO", "LITERATURA", "SINING (MULTIMEDIA)", "SINING (VISUAL ARTS)" ];

    let sections;


    let updateAttendance = async (attName, section, guild) => {
        var accessToken = gapi.auth.getToken().access_token;
        // Name Index: Position of the Student's name in the Google Sheet
        var nameIndex = 1;
        const meetingDatesStartIndex = 3;
        let nextMeetingDay;

        attName = attName.replace(/\s\w{1,2}\.$/, "");  // Strip middle name

        if(LISTOGuilds.includes(guild)) {
            sheetName = "LISTA_SectionBased_Attendance";
            sections = {
                "ABM1101": [4, 7],
                "CA1101": [9, 22],
                "DA1101": [9, 22],
                "HUMSS1101": [24, 29],
                "TO1101": [24, 29],
                "ITM1101": [31, 54],
                "STEM1101": [56, 81],
                "STEM1102": [83, 92],
                "ABM1201": [95, 113],
                "CA1201": [115, 121],
                "DA1201": [115, 121],
                "HUMSS1201": [123, 134],
                "ITM1201": [136, 160],
                "STEM1201": [162, 178],
                "STEM1202": [180, 195],
            };
            sheetID = 1382711057;
        } else if(GILASGuilds.includes(guild)) {
            sheetName = "LISTA_SectionBased_GILAS_Attendance";
            sections = {
                "STEM1101": [4, 11],
                "STEM1102": [13, 41],
                "ABM1101": [43, 52],
                "HUMSS1101": [54, 68],
                "ITM1101": [70, 83],
                "TO1101": [85, 95],
                "CA1101": [97, 100],
                "DA1101": [102, 106],
                "STEM1201": [108, 123],
                "STEM1202": [125, 133],
                "ABM1201": [135, 148],
                "HUMSS1201": [150, 160],
                "TO1201": [162, 183],
                "ITM1201": [185, 194],
                "CA1201": [196, 202],
                "DA1201": [204, 210],
            };
            sheetID = 634796021;
        }

        const sheetDates = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}/values/${sheetName}!D2:2`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        let dates;

        try {
            dates = (await sheetDates.json())["values"][0];
        } catch(e) {
            dates = [];
        }

        const dateToday = new Date();

        // Check if today is already added in the meeting dates row
        if(dates[dates.length-1] === dateToday.toLocaleDateString('en-us',
                                                    { month: 'short' , day: 'numeric' }).split(" ").join(". ")) {
            nextMeetingDay = dates.length;
        } else {
            console.log("Cannot find Current Date in Google Sheets\nAdding a new Column!");

            fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}:batchUpdate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        //update this token with yours.
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        "requests": [{
                            "updateCells": {
                                "range": {
                                    "sheetId": sheetID,
                                    "startColumnIndex": meetingDatesStartIndex + dates.length ,
                                    "endColumnIndex": meetingDatesStartIndex + dates.length + 1,
                                    "endRowIndex": 2,
                                    "startRowIndex": 1
                                },
                                "fields": "*",
                                "rows": [{
                                    "values": [{
                                        "userEnteredValue":{
                                            "stringValue": dateToday.toLocaleDateString('en-us', { month: 'short' , day: 'numeric' }).split(" ").join(". ")
                                        }
                                    }]
                                }]
                            }
                        }]
                    }),
                }
            );

            nextMeetingDay = dates.length + 1;
        }

        const request = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}/values/${sheetName}!A${sections[section][0]}:B${sections[section][1]}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await request.json();

        // Finding and getting the position of the Student's name
        for (var i in data["values"]) {
            if (data["values"][i][1] === attName) {
                nameIndex = parseInt(i) +  sections[section][0];
                console.log("Located at Column 1, Row " + nameIndex);

                fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}:batchUpdate`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },

                        body: JSON.stringify({
                            requests: [
                                {
                                    updateCells: {
                                        rows: [
                                            {
                                                values: [
                                                    {
                                                        userEnteredValue: {
                                                            stringValue:
                                                                "P",
                                                        },
                                                    },
                                                ],
                                            },
                                        ],
                                        range: {
                                            sheetId: sheetID,
                                            // Change Meeting Day
                                            startColumnIndex: meetingDatesStartIndex + (nextMeetingDay - 1),
                                            endColumnIndex: meetingDatesStartIndex + nextMeetingDay,
                                            endRowIndex: nameIndex,
                                            startRowIndex: nameIndex - 1,
                                        },
                                        fields: "*",
                                    },
                                },
                            ],
                        }),
                    }
                );
                return;
            }
        }

        console.log("Couldn't Find Name");
        console.log(data);
        return data;
    };

    // useEffect() means if this component is rendered (shown to the user)
    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader", {
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
        }); // Use the div with id 'reader' as our QR Code Reader
        const config = { fps: 5, qrbox: 200 }; //  QR Code Reader configurations

        // Start reader using back camera
        html5QrCode
            .start(
                { facingMode: "user" },
                config,
                (text, result) => {
                    // Parse QR Code content and update our states
                    let parsed = parseResult(aes.decrypt(text, "@stamaria.sti.edu.ph").toString()  // Raw result to hex
                                    .match(/.{1,2}/g).map(function(v) {                // Hex to string
                                        return String.fromCharCode(parseInt(v, 16));
                                    }).join(''))

                    setName(parsed.name);
                    setStudentNumber(parsed.studentNumber);
                    setGuild(parsed.guild);
                    setSection(parsed.section);

                    setHasScanned(true);
                },
                (errorMessage) => {
                    // If scan has error, this block will execute
                    console.log(errorMessage);
                }
            )
            .catch((err) => {
                // This block will execute if the app has trouble starting the camera
                console.log(err);
            });
    }, []);

    let confirmAttendance = () => {
        updateAttendance(name, section, guild);

        setHasScanned(false);

        setName("");
        setStudentNumber("");
        setGuild("");
        setSection("");
    }

    let renderToolbar = () => {
        return (
            <Ons.Toolbar id="toolbar">
                <div className="left">
                    <div className="sidebyside">
                        <Ons.ToolbarButton style={{ color: "white" }} onClick={ () => setSideMenuOpen(true) }>
                            <Ons.Icon icon="md-menu"></Ons.Icon>


                        </Ons.ToolbarButton>

                        <span id="toolbar-title">Lista</span>
                        <LoginButton></LoginButton>
                        <LogoutButton></LogoutButton>
                    </div>
                </div>
            </Ons.Toolbar>
        );
    }

    // Render all visible parts of our app, place all (HTML) contents here
    return (
        <Ons.Page>
            <Ons.Splitter>
                <Ons.SplitterSide
                    side="left"
                    width={ "300" }
                    swipeable={ true }
                    collapse={ true }
                    isOpen={ sideMenuOpen }
                    onPostClose={ () => setSideMenuOpen(false) }>

                    <Ons.Page>
                        <div id="logo" align="center" >
                            <img src={ require("./assets/iredoc-logo.png") } style={{ height: "300px" }} alt="iredoclogo" />
                        </div>

                        <hr />

                        <p align="center">STI LISTO Club All Rights Reserved</p>
                        <p align="center">PBP Group | IREDOC Guild</p>
                    </Ons.Page>
                </Ons.SplitterSide>

                <Ons.SplitterContent>
                    <Ons.Page
                        renderToolbar={ renderToolbar }>

                        <br /><br />

                        <div id="reader"></div>

                        <br /><br />

                        {/* Display QR Code content. This is a temporary proof of concept
                            QR Code content should be synced to google sheets */}
                        <div align="center" id="student-information">
                            <Ons.Card>
                                <h2 className="title" align="center">Student Information</h2>

                                <p id="name">Name: {name}</p>
                                <p id="student-number">Student number: {studentNumber}</p>
                                <p id="guild">Guild: {guild}</p>
                                <p id="section">Section: {section}</p>
                            </Ons.Card>
                        </div>

                        <div id="buttons">
                            <Ons.Button modifier="large--cta" onClick={ confirmAttendance } disabled={ !hasScanned }>
                                CONFIRM
                            </Ons.Button>
                        </div>
                    </Ons.Page>
                </Ons.SplitterContent>
            </Ons.Splitter>
        </Ons.Page>
    );
};

export default App;
