import React, { useState, useEffect } from 'react';
import './App.css';
import logo from './selfie.jpg';
import loading from './garfield.gif';
import loadingCat from './cattype.gif';
import workInProgress from "./img/workInProgress.gif";
import workingReallyHard from "./img/yellowHair.gif";

import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
const ffmpeg = createFFmpeg({ log: true });
// const ffmpeg = createFFmpeg({log: false});


function App() {
  // the actual webassembly binary has not been bundled in our app
  // since it is a large file and we don't want it to block our app right away
  // we load it asynchronously over a cdn
  // the following is to keep track of the loading state
  let isLoadingCat = true;
  
  const currentYear = new Date().getFullYear();

  const [isWorkingOnGif, setIsWorkingOnGif] = useState(false);

  const [isWorkingOnVid, setIsWorkingOnVid] = useState(false);

  const [ready, setReady] = useState(false);

  const [video, setVideo] = useState();

  const [gif, setGif] = useState();

  const [convertVideo, setConvertedVideo] = useState();

  const [beginning, setBeginning] = useState('');
  const [end, setEnd] = useState('');

  const [workInProgressGif, setWorkInProgressGif] = useState(loadingCat);

  const load = async () => {
    
    await ffmpeg.load(); // awaits the promise
    setReady(true);
    document.getElementById('gifButton').disabled = true;
    document.getElementById('mp4Button').disabled = true;
    // use the setReady method to turn the loading state to true after the ffmpeg binary has been loaded
  };

  useEffect(() => {
    
    load();
  }, []);

  const handleBeginning = (e) => {
    const beginningVal = e.target.value;
    setBeginning(beginningVal);
  };

  const handleEnd = (e) => {
    const endVal = e.target.value;
    setEnd(endVal);
  };

  const testInput = (fileType) => {
    const type = fileType;
    // console.log("the type is🇨🇳",type);
    if (!type.includes('video')) {
      // if the type does not include "video", that is a wrong type and we disable the convert button
      document.getElementById('gifButton').disabled = true;
      document.getElementById('mp4Button').disabled = true;
      return false;
    } else {
      document.getElementById('gifButton').disabled = false;
      document.getElementById('mp4Button').disabled = false;
      return true;
    }
  };

  const processInput = (file) => {
    let isCorrectType;
    if (file.name.includes('.mkv') || file.name.includes('.MKV')) {
      isCorrectType = true; // mkv is a special case
      document.getElementById('gifButton').disabled = false;
      document.getElementById('mp4Button').disabled = false; 
    } else {
      isCorrectType = testInput(file.type);
    }

    // console.log(typeof file.name);
    if (isCorrectType) {
      setVideo(file);
      
    } else {
      alert('Wrong type my friend, plz choose a video format😃');
    }
  };

  const rotateDisplayGif = () => {
    setInterval(() => { 
      if (isLoadingCat) {
        setWorkInProgressGif(workingReallyHard);
        isLoadingCat = false;
      }  else {
        setWorkInProgressGif(loadingCat);
        isLoadingCat = true;
      }
    }, 10000); // every 10 seconds we rotate to a different gif file to keep the user engaged

  }

  const convertToGif = async (e) => {
    e.preventDefault(); // stop the page from refreshing
    setIsWorkingOnGif(true);
    // first
    // take the vid file the from the user and save it to the memory as temp.mp4 regardless of the video type
    // now, this can be accessed by webassembly while it is in memory
    // this file only stays in the memory until the browser is refreshed
    ffmpeg.FS('writeFile', 'temp.mp4', await fetchFile(video));

    //run the ffmpeg command to convert the temp.mp4 file into a gif file
    //-i is the input file and -f flag to indicate an gif file

    if (beginning === "" || end === "") {
      await ffmpeg.run('-i', 'temp.mp4', 'out.gif');
    } else {
      if (isNaN(beginning) || isNaN(end) ) {
        // console.log("not a number");
        await ffmpeg.run('-i', 'temp.mp4', 'out.gif');
      } else {
        // console.log("good is a number");
        await ffmpeg.run("-i",'temp.mp4', "-t",end, "-ss",beginning, "-f", "gif", "out.gif");
      }
      
    }

    // read the file
    const data = ffmpeg.FS('readFile', 'out.gif'); // convert it to output.gif

    // convert it to a url so that it can be used
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'image/gif' }),
    );

    setEnd('');
    setBeginning('');
    setIsWorkingOnGif(false);
    setGif(url);
  };

  const convertToMp4 = async (e) => {
    e.preventDefault(); // stop the page from refreshing
    setIsWorkingOnVid(true);
    setConvertedVideo();
    rotateDisplayGif();
    let videoType = video.type;
    let videoName = video.name;
    let fileTypeB4;
    if (videoName.includes('.mkv') || videoName.includes('.MKV')) {
      videoType = 'mkv';
    } // mkv is an edge case since its type is empty

    if (videoType === 'video/quicktime') {
      fileTypeB4 = 'temp.mov';
    } else if (videoType === 'video/avi') {
      fileTypeB4 = 'temp.avi';
    } else if (videoType === 'video/mp4') {
      fileTypeB4 = 'temp.mp4';
    } else if (videoType === 'video/x-flv') {
      fileTypeB4 = 'temp.flv';
    } else if (videoType === 'video/x-ms-wmv') {
      fileTypeB4 = 'temp.wmv';
    } else if (videoType === 'video/webm') {
      fileTypeB4 = 'temp.webm';
    } else if (videoType === 'mkv') {
      fileTypeB4 = 'temp.mkv';
    } else {
      fileTypeB4 = 'temp.mp4';
    }

    console.log('typeis', fileTypeB4);

    ffmpeg.FS('writeFile', fileTypeB4, await fetchFile(video));

    
    if (beginning === "" || end === "") {
      await ffmpeg.run('-i', fileTypeB4, 'out.mp4');
    } else {
      if (isNaN(beginning) || isNaN(end) ) {
        // console.log("not a number");
        await ffmpeg.run('-i', fileTypeB4, 'out.mp4');
      } else {
        // console.log("good is a number");
        await ffmpeg.run("-i",fileTypeB4, "-t",end, "-ss",beginning, "-f", "mp4", "out.mp4");
      }
      
    }
    

    const data = ffmpeg.FS('readFile', 'out.mp4'); // convert it to output.mp4

    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: 'video/mp4' }),
    );

    setEnd('');
    setBeginning('');
    setIsWorkingOnVid(false);
    setConvertedVideo(url);
  };

  return ready ? (
    <>
    <div className="App">
      <h1>Eddie's file converter</h1>
      <h4>Here, we can convert .mov, .avi, .flv, .wmv, .webm, .mkv into .MP4 files</h4>
      <h4>We can also convert the above audio files into .gif files</h4>
      {video && (
        <video controls width="250" src={URL.createObjectURL(video)}></video>
      )}
      <input
        type="file"
        onChange={(e) => processInput(e.target.files?.item(0))}
      />
      <p></p>
      <p></p>

      <form action="">
        <label>Beginning timestamp: </label>
        <input onChange={handleBeginning} value={beginning} placeholder="beginning timestamp"></input>
        <br />
        <p></p>
        <p></p>
        <label>Time span: </label>
        <input onChange={handleEnd} value={end} placeholder="time span"></input>
        <div className="tooltip">Question?
          <span className="tooltiptext">Esp: If you have a 28-second-video and choosing 10 as the beginning timestamp and 2 as the time span would yield a two-second-video/gif, starting from the 10 second timestamp from the video</span>
        </div>
        <br />
        <h5>🚨If you do not specify the time, it will default to the full clip. If the time format is not right,it might fail</h5>
        <button onClick={convertToGif} id="gifButton">
          Convert To gif
        </button><br/><br/>

        <button onClick={convertToMp4} id="mp4Button">
          Convert To mp4
        </button>
      </form>

      <h1>Result: </h1>
      <h2>GIF 👇: </h2>
      {gif && <h5>Right click the below .Gif and choose "Save Image As..." to download it </h5>}
      {isWorkingOnGif && <img src={workInProgress} width="300" alt="Logo" />}
      {gif && <img src={gif} width="250" />}

      <h2>MP4 Video 👇: </h2>
      {convertVideo && <h5>Click the "3 vertical dots" on the botton right corner to download it </h5>}
      {convertVideo && 
      <video controls width="250">
      <source src={convertVideo} width="250" />
      </video>}
      
      {isWorkingOnVid && <img src={workInProgressGif} width="300" alt="working cat" />}

      <div className="selfieDiv">
      <img src={logo} width="300" alt="Logo" />
      </div>
      
    </div>
    <div className="footerDiv">
     © Copyright {currentYear} eddieprogramming
      </div>
      </>
  ) : (
    <p>Loading ...</p>
  );
}

export default App;
