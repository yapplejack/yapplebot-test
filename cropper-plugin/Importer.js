import React, { useEffect } from 'react';
import { useState } from 'react';
import ReactCrop, {makeAspectCrop, centerCrop} from 'react-image-crop';
import { saveAs } from 'file-saver';
import '/cropper-plugin/ReactCrop.css';
import { element } from 'prop-types';

//Notes on LocalCrop.css in relation to google doc importing
//96 px = 1 inch in google docs, doc is 8.5" long so google doc length is 816 px and images from default margin to margin is 720px
//images will be imported larger
//currently the docs pages are 990pxs meaning images can be upscaled by 1.375


//Current bugs: 
 
function Importer() {
    var numImages = 0;
    const [files, setFiles] = useState([]);
    const [importedStyles, setStyles] = useState([]);
    const [numStyles, setNumStyles] = useState('');
    const [src, setSrc] = useState('');
    const [crop, setCrop] = useState({ aspect: 16 / 9 });
    const [output, setOutput] = useState(null);


    const [currFile, setCurrFile] = useState('');
    const [prevFile, setPrevFile] = useState('');
    const [croppedFiles, setCroppedFiles] = useState([]);
    const [aspect, setAspect] = useState('');

    const [importText, setText] = useState([]);
    const [exportText, setExportText] = useState([]);


    var image;
    const zip = require('jszip')();

    useEffect(() => {
        if(importText != '' && files != '' && importedStyles.length == files.length - 2 && numStyles == files.length - 2){
            console.log("called");
            modifyImages(importText);

        }
    }, [importText, files, numStyles])

    useEffect(() => {
        /*
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
        }*/
    }, [currFile, croppedFiles])


    const modifyImages = (mdInput) => {
        let mdText = mdInput.split("<img");
        for(let i = 1; i < mdText.length; i++)
        {
            //console.log(mdText[i].split("/>")[0]);
            exportText[i-1] = modifyImageTag(mdText[i].split("/>")[0], i-1);
            exportText[i-1] = modifySpanTag(i-1) + exportText[i-1];    
        }
        modifyMarkdownFile(mdInput);
        generateFiles();
    }

    const modifyImageTag = (mdText, index) => {
        //first start by finding the correct image in the hmtl (splitting could be more better but it works)
        croppedFiles[index] = files[parseInt(importedStyles[index].split("images/")[1].split('\"')[0].split('image')[1].split('\.jpg')[0])];
        setCroppedFiles(croppedFiles);

        let htmlText = importedStyles[index].split('<img')[1].split('\.jpg\" ')[1];
        mdText = mdText.split('default\}')[0];
        return '<img ' + mdText + 'default\} ' + htmlText.split('\}\}')[0] + ', maxWidth: "none", overflowClipMargin: \'content-box\', overflow: \'clip\'\}\}' + htmlText.split('\}\}')[1];
    }

    const modifySpanTag = (index) => {
        return importedStyles[index].split('>')[0] + ">"
    }

    const upscaleFromHMTL = (mdText) => {

    }

    const modifyMarkdownFile = (mdInput) => {
        let mdText = mdInput.split("<img");
        let endText = mdInput.split("/>");
        let finalText = mdText[0] + exportText[0];
        for(let i = 1; i < mdText.length - 1; i++)
        {
            finalText = finalText + mdText[i].split('/>')[1] + exportText[i];
        }
        finalText = finalText + mdText[mdText.length - 1].split('/>')[1];
        console.log(finalText);
    }


    const generateFiles = () => {
        for(let i = 0; i < croppedFiles.length; i++)
        {
            zip.file("image_" + i + ".jpg", croppedFiles[i]);
        }
        zip.generateAsync({type: "blob"}).then(content => {
            saveAs(content, "example.zip");
        });
    }

    const setImage = () => {
        image = src;
    }

    const setupProgram = async (file) => {
        let tempText = await file[0].text();
        //let dims = tempText.split("\n");
        setText(tempText);
        setCurrFile(1);
        setPrevFile(1);
        numImages = file.length;
        setFiles(file);
        let htmlContent = await file[file.length-1].text();
        htmlContent = htmlContent.split('</head>')[1].split('span style');
        //console.log(htmlContent);
        //style={{width: "385.49px", height: "175.10px", marginLeft: "-60.26px", marginTop: "0.00px", transform: "rotate(0.00rad) translateZ(0px), maxWidth: 'none",overflowClipMargin: 'content-box', overflow: 'clip'}} /></tester></Highlight>
        for(let i = 1; i < htmlContent.length; i++)
        {
            //let res = htmlContent[i].split('</span>')[0].replaceAll(";", ",").replaceAll('margin-left', 'marginLeft').replaceAll('margin-top', 'marginTop').replace('-webkit-transform: rotate(0.00rad) translateZ(0px),"', "").replaceAll(
            //    'border: 0.00px solid #000000,', '').replace('="', "").replaceAll(', -webkit-transform: rotate(0.00rad) translateZ(0px),', "").replace('px,"', "px").replace('>', '}}>').replace('">', "'}}>").replace("style=", "style={{ ");
            //res = "<span style={{" + res + "</img> </span>"

            const reg = /-\webkit\-transform: 'rotate\(\d{1}\.\d{2}rad\) translateZ\(\d{1}px\)',/;

            let res = htmlContent[i].split('</span>')[0].replaceAll(";", "',").replaceAll(": ", ": '").replaceAll('margin-left', 'marginLeft').replaceAll('margin-top', 'marginTop').replace(reg, "")
            
            .replaceAll('border: 0.00px solid #000000,', '').replace('="', "").replaceAll(", -webkit-transform: 'rotate(0.00rad) translateZ(0px)',", "").replace('px,"', "px").replace('>', '}}>').replace('">', "'}}>").replace("style=", "style={{ ")
            .replace("px',\"", "px'").replace("\" title=\"'", "").replace("\"width", 'width');
            res = "<span style={{" + res + "</img> </span>"

            //use this code to check for all images
            //let res = htmlContent[i].split('</span>')[0].split('src="images/')[1].split('"')[0].replace('image', '').replace('.jpg', '');
            //console.log(res)
            //let temper = [];
            if(importedStyles)
            {
                importedStyles[i-1] = res;
                //temper = importedStyles;
                //temper[i-1] = res;
            }
            else{
                importedStyles[i-1] = res;
                //temper[i-1] = res;
            }
            setStyles(importedStyles);
            setNumStyles(i);
            
        }
        //importedStyles.sort(function(a,b){return parseInt(a) - parseInt(b)});
        //console.log(importedStyles);
        //modifyImages(tempText);
        //console.log(importedStyles);
    }

    const startCropping = async (file) => {
        if(file[0].name.split('.').pop() != "md")
        {
            throw new Error('Please attach your markdown file as the first file (rename it so that it comes first in the file directory');
        }
        if(file[file.length-1].name.split('.').pop() != "html")
        {
            throw new Error('Please have your HTML file last (rename it to be last in the file directory)');
        }
        await setupProgram(file);
    }
 
    const selectImage = () => {
        const url = URL.createObjectURL(files[currFile]);
        let height = parseFloat(importText[currFile-1].split(' ')[0]);
        let width = parseFloat(importText[currFile-1].split(' ')[1]);
        setSrc(url);
        document.querySelector('img').src = url;
        document.querySelector('img').onload = () => {
            let height = parseFloat(importText[currFile-1].split(' ')[0]);
            let width = parseFloat(importText[currFile-1].split(' ').pop());

            //setAspect(document.querySelector('img').naturalWidth/document.querySelector('img').naturalHeight);
            //console.log(aspect);
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
 
export default Importer;