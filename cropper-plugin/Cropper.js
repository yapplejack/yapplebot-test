import React, { useEffect } from 'react';
import { useState } from 'react';
import ReactCrop, {makeAspectCrop, centerCrop} from 'react-image-crop';
import { saveAs } from 'file-saver';
import '/cropper-plugin/ReactCrop.css';

//Notes on LocalCrop.css in relation to google doc importing
//96 px = 1 inch in google docs, doc is 8.5" long so google doc length is 816 px and images from default margin to margin is 720px
//images will be imported larger
//currently the docs pages are 990pxs meaning images can be upscaled by 1.375


//Current bugs: 
 
function Cropper() {
    var numImages = 0;
    const [src, setSrc] = useState('');
    const [crop, setCrop] = useState({ aspect: 16 / 9 });
    const [output, setOutput] = useState(null);
    const [files, setFiles] = useState('');


    const [currFile, setCurrFile] = useState('');
    const [prevFile, setPrevFile] = useState('');
    const [croppedFiles, setCroppedFiles] = useState([]);
    const [aspect, setAspect] = useState('');

    const [importText, setText] = useState([]);


    var image;
    const zip = require('jszip')();

    useEffect(() => {
        if(importText != '' && files != ''){
            console.log(importText);
            selectImage();
        }
    }, [importText, files])

    useEffect(() => {
        if(prevFile != currFile && currFile != 1)
        {
            setPrevFile(prevFile + 1);
            if(files.length <= currFile)
            {
                for(let i = 0; i < files.length - 1; i++)
                {
                    zip.file("image_" + i + ".jpg", croppedFiles[i]);
                }
                zip.generateAsync({type: "blob"}).then(content => {
                    saveAs(content, "example.zip");
                });
            }
            else if(files.length - 1 <= currFile)
            {
                document.querySelector('button').innerHTML = "Crop and Download";
                return selectImage();
            }
            else{   
                return selectImage();
            }
        }
    }, [currFile, croppedFiles])

    useEffect(() => {
        console.log(aspect);
    }, [aspect])



    const setImage = () => {
        image = src;
    }

    const setupProgram = async (file) => {
        let tempText = await file[0].text();
        let dims = tempText.split("\n");
        setText(dims);
        setCurrFile(1);
        setPrevFile(1);
        numImages = file.length;
        setFiles(file);
        let htmlContent = await file[1].text();
        htmlContent = htmlContent.split('</head>')[1].split('span style');
        console.log(htmlContent);
        let importedStyles = [];
        //style={{width: "385.49px", height: "175.10px", marginLeft: "-60.26px", marginTop: "0.00px", transform: "rotate(0.00rad) translateZ(0px), maxWidth: 'none",overflowClipMargin: 'content-box', overflow: 'clip'}} /></tester></Highlight>
        for(let i = 1; i < htmlContent.length; i++)
        {
            let res = htmlContent[i].split('</span>')[0].replaceAll(";", "',").replaceAll(": ", ": '").replaceAll('margin-left', 'marginLeft').replaceAll('margin-top', 'marginTop').replace('-webkit-transform: rotate(0.00rad) translateZ(0px),"', "").replaceAll(
                'border: 0.00px solid #000000,', '').replace('="', "").replaceAll(', -webkit-transform: rotate(0.00rad) translateZ(0px),', "").replace('px,"', "px").replace('>', '}}>').replace('">', "'}}>").replace("style=", "style={{ ");
            res = "<span style={{" + res + "</img> </span>"
            console.log(res)
        }
    }

    const startCropping = async (file) => {
        if(file[0].name.split('.').pop() != "txt")
        {
            throw new Error('All images from a section must be attached at once with the generated txt file as the first file attached.')
        }
        await setupProgram(file);
    }
 
    const selectImage = () => {
        const url = URL.createObjectURL(files[currFile]);
        console.log(files[currFile].naturalWidth);
        //setCrop({unit: 'px', x:0, y:0, height:importText[currFile-1].split(' ')[0], width: importText[currFile-1].split(' ').pop()});
        let height = parseFloat(importText[currFile-1].split(' ')[0]);
        let width = parseFloat(importText[currFile-1].split(' ')[1]);
        setAspect(width / height);
        setCrop(centerCrop(
            makeAspectCrop(
            {
              unit: 'px',
              width: width,
            },
            width / height,
            width,
            height
          ),
          0,
          0
          ));
        //setCrop({aspect: parseFloat(importText[currFile-1].split(' ')[0])/ parseFloat(importText[currFile-1].split(' ').pop())});
        setSrc(url);
        document.querySelector('img').src = url;
        document.querySelector('img').onload = () => {
            let height = parseFloat(importText[currFile-1].split(' ')[0]);
            let width = parseFloat(importText[currFile-1].split(' ').pop());

            //setAspect(document.querySelector('img').naturalWidth/document.querySelector('img').naturalHeight);
            console.log(aspect);
        }
        if(ReactCrop)
        {
            ReactCrop.src = url;
        }
    };

    async function getBlob(canvas) 
    {
        const myBlob = await new Promise(resolve => canvas.toBlob(resolve));
        croppedFiles[currFile-1] = myBlob;
        setCroppedFiles(croppedFiles);
        setCurrFile(currFile + 1);
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
        //setOutput(base64Image);

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
            <div className="Cropper">
                <center>
                    <input multiple
                        type="file"
                        onChange={(e) => {
                            startCropping(e.target.files);
                        }}
                    />
                    <br />
                    <br />
                    <div>
                        <div>
                            <ReactCrop src={src} onImageLoaded={setImage()}
                                crop={crop} onChange={setCrop} aspect={aspect}>
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
 
export default Cropper;