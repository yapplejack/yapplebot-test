import React from 'react';
import { useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { saveAs } from 'file-saver';
import { PixelCrop } from 'react-image-crop';
 
function App() {
    var numImages = 0;
    const [src, setSrc] = useState('');
    const [crop, setCrop] = useState({ aspect: 16 / 9 });
    var image;
    const [output, setOutput] = useState(null);
    const [files, setFiles] = useState('');
    const [currFile, setCurrFile] = useState('');
    const [croppedFiles, setCroppedFiles] = useState([]);
    const zip = require('jszip')();

    const setImage = () => {
        image = src;
    }
 
    const selectImage = (file) => {
        setCurrFile(0);
        numImages = file.length;
        setFiles(file)
        console.log(files)
        const url = URL.createObjectURL(file[0]);
        setCrop({unit: 'px', x:0, y:0, width:10, height:10});
        setSrc(url);
        document.querySelector('img').src = url;
        if(ReactCrop)
        {
            console.log("foud");
            ReactCrop.src = url;
        }
        //document.querySelector('ReactCrop').src = url;
    };

    async function getBlob(canvas) 
    {
        const myBlob = await new Promise(resolve => canvas.toBlob(resolve));
        croppedFiles[currFile] = myBlob;
        setCroppedFiles(croppedFiles);
        setCurrFile(currFile + 1);
        if(files.length <= currFile)
        {
            for(let i = 0; i < files.length; i++)
            {
                zip.file("image_" + i + ".jpg", croppedFiles[i]);
            }
            zip.generateAsync({type: "blob"}).then(content => {
                saveAs(content, "example.zip");
            });
        }
        else if(files.length - 1 <= currFile)
        {
            document.querySelector('button').innerHTML = "Download";
            return getNewFile();
        }
        else{
            return getNewFile();
        }
    }
 
    const cropImageNow = () => {
        const canvas = document.querySelector('canvas');
        image = document.getElementById("source");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
 
        const pixelRatio = window.devicePixelRatio;
        canvas.width = crop.width * pixelRatio;
        canvas.height = crop.height * pixelRatio;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';
        
 
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height,
        );
 
        // Converting to base64
        const base64Image = canvas.toDataURL('image/jpeg');
        setOutput(base64Image);

        getBlob(canvas);
         
    };

    const getNewFile = () => {
        console.log(files)
        if(files.length <= currFile)
        {
            console.log("hi")
            //zip.generateAsync({type: "blob"}).then(content => {
            //    saveAs(content, "example.zip");
            //});
        }
        else{
            console.log(src);
            var ur = URL.createObjectURL(files[1]);
            setSrc(ur);
            document.querySelector('img').src = ur;
            if(ReactCrop)
            {
                console.log("foud");
                ReactCrop.src = ur;
            }
        }
    }
 
    return (
            <div className="App">
                <center>
                    <input multiple
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            selectImage(e.target.files);
                        }}
                    />
                    <br />
                    <br />
                    <div>
                        <div>
                            <ReactCrop src={src} onImageLoaded={setImage()}
                                crop={crop} onChange={setCrop}>
                                <img id='source' scr = {src}/>        
                            </ReactCrop>
                            <br />
                            <button onClick={cropImageNow}>Crop</button>
                            <br />
                            <br />
                        </div>
                        
                </div>
                    <div>
                        <canvas id='my-canvas'
                        />
                    </div>

                </center>
            </div>
    );
}
 
export default App;