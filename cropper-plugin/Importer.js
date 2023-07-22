import React, { useEffect } from 'react';
import { useState } from 'react';
import ReactCrop from 'react-image-crop';
import { saveAs } from 'file-saver';
import '/cropper-plugin/ReactCrop.css';

//Notes on LocalCrop.css in relation to google doc importing
//96 px = 1 inch in google docs, doc is 8.5" long so google doc length is 816 px and images from default margin to margin is 720px
//images will be imported larger
//currently the docs pages are 990pxs meaning images can be upscaled by 1.375
// 958 is current size of unmodified doc column, so from 531 to 958 is a resize of 1.8 however the html size is not refecltive of the size in google docs
// we are using 1.35 as the conversion factor rn but we should do the math and not be lazy



//Revalations: currently our md export is not putting images in the correct locations or order. HMTL appears to always have the image in the ideal location. Text must be read in from HMTL to ensure correct image locations.
//MD must be rewritten to always have images in correct order as we still need to know the float location from the images.


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
    
    const [spacing, setSpacing] = useState([]);


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
            exportText[i-1] = modifySpanTag(mdText[i].split("/>")[0], i-1) + exportText[i-1];    
        }
        upscaleFromHMTL();
        modifyMarkdownFile(mdInput);
        //generateFiles();
    }

    const modifyImageTag = (mdText, index) => {
        //first start by finding the correct image in the hmtl (splitting could be more better but it works)
        croppedFiles[index] = files[parseInt(importedStyles[index].split("images/")[1].split('\"')[0].split('image')[1].split('\.jpg')[0])];
        setCroppedFiles(croppedFiles);

        let htmlText = importedStyles[index].split('<img')[1].split('\.jpg\" ')[1];
        mdText = mdText.split('default\}')[0];
        return '<img ' + mdText + 'default\} ' + htmlText.split('\}\}')[0] + ', maxWidth: "none"\}\}' + htmlText.split('\}\}')[1];
    }

    // anything new must be inserted BEFORE lenght and width at this stage
    const modifySpanTag = (mdText, index) => {
        
        let floatPosition = importedStyles[index].split('width')[0] + 'width' + importedStyles[index].split('width')[1].split('\}\}')[0];
        if(mdText.match(/left=\"-?(\d+)/i))
        {
            console.log(parseFloat(mdText.match(/left=\"-?(\d+)/i)[1]));
            if (parseFloat(mdText.match(/left=\"-?(\d+)/i)[1]) > 375)
            {
                floatPosition = importedStyles[index].split('width')[0] + 'float: \'right\', ' + 'width' + importedStyles[index].split('width')[1].split('\}\}')[0];
            }
            else{
                floatPosition = importedStyles[index].split('width')[0] + 'float: \'left\', ' + 'width' + importedStyles[index].split('width')[1].split('\}\}')[0];
            }
        }
        return floatPosition + "\}\}>"
    }

    const upscaleFromHMTL = () => {
        for(let i = 0; i < exportText.length; i++)
        {
            let widths = exportText[i].split('width: \'');
            let heights = exportText[i].split('height: \'');
            let margTop = exportText[i].split('marginTop: \'');
            let margLeft = exportText[i].split('marginLeft: \'');
            for(let j = 1; j < 3; j++)
            {
                widths[j-1] = widths[j].split('px')[0];
                heights[j-1] = heights[j].split('px')[0];
            }
            margTop[0] = margTop[1].split('px')[0];
            margLeft[0] = margLeft[1].split('px')[0];
            //console.log(exportText[i]);
            //console.log(widths[0] + " converted: " + Math.round(parseFloat(widths[0]) * 1.8 * 100)/100);
            exportText[i] = exportText[i].split('width: \'')[0] + 'width: \'' + Math.round(parseFloat(widths[0]) * 1.375  * 100)/100 + 'px\', height: \'' 
            + Math.round(parseFloat(heights[0]) * 1.375 * 100)/100 + 'px\'\}\}' + exportText[i].split('\}\}')[1].split('width: \'')[0] + 'width: \'' 
            + Math.round(parseFloat(widths[1]) * 1.375  * 100)/100 + 'px\', height: \''
            + Math.round(parseFloat(heights[1]) * 1.375  * 100)/100 + 'px\', marginLeft: \''
            + Math.round(parseFloat(margLeft[1]) * 1.375  * 100)/100 + 'px\', marginTop: \''
            + Math.round(parseFloat(margTop[1]) * 1.375  * 100)/100 + 'px\', transform' + exportText[i].split('\}\}')[1].split('transform')[1] + '\}\}' + exportText[i].split('\}\}')[2];
        }
    }

    const modifyMarkdownFile = (mdInput) => {
        let mdText = mdInput.split("<img");
        let finalText = mdText[0] + exportText[0];
        for(let i = 1; i < mdText.length - 1; i++)
        {
            let space = " ";
            if(spacing[i] > 0)
            {
                space += '<p>'
                for(let j =0; j < spacing[i]; j++)
                {
                    space += '<br /> '
                }
                space += '</p>'
            }
            finalText = finalText + "\n\n" + mdText[i].split('/>')[1] + exportText[i] + space;
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
            res = "<span style={{" + res + "</img> </span>";

            spacing[i-1] = htmlContent[i].split('"c1 c2"').length-1;

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
            setSpacing(spacing);
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

/*
            if(htmlContent[i].split('<span')[1].match(/\"><$/))
            {
                numSpaces += 1;
            }
            else if(numSpaces > 0)
            {
                let space = "<p>";
                for(let j =0; j < numSpaces; j++)
                {
                    space += '<br /> '
                }
                space += '</p>'
                numSpaces = 0;
                importedHTML[currIndex] = ['space', space];
                currIndex += 1;
            }
            if(htmlContent[i].match(/hr\sstyle=/i))
            {
                importedHTML[currIndex] = ["break", 'pageBreak'];
                currIndex += 1;
            }
            if(htmlContent[i].split('span')[1].match(/style/i))
            {
                const reg = /-\webkit\-transform: 'rotate\(\d{1}\.\d{2}rad\) translateZ\(\d{1}px\)',/;

                let res = htmlContent[i].split('span style')[1].split('</span>')[0].replaceAll(";", "',").replaceAll(": ", ": '").replaceAll('margin-left', 'marginLeft').replaceAll('margin-top', 'marginTop').replace(reg, "")
                
                .replaceAll('border: 0.00px solid #000000,', '').replace('="', "").replaceAll(", -webkit-transform: 'rotate(0.00rad) translateZ(0px)',", "").replace('px,"', "px").replace('>', '}}>').replace('">', "'}}>").replace("style=", "style={{ ")
                .replace("px',\"", "px'").replace("\" title=\"'", "").replace("\"width", 'width');
                res = "<span style={{" + res + "</img> </span>";
                importedHTML[currIndex] = ["img", res];
                currIndex += 1;
                imageNum += 1;
            }
            else if(htmlContent[i].split('span')[1].match(/<\/a>/))
            {
                //console.log(htmlContent[i].split('>'))
                importedHTML[currIndex] = ["a", '<a' + htmlContent[i].split('<a')[1].split('<\/a>')[0] + '<\/a>'];
                currIndex += 1;
            }
            else if(numSpaces == 0)
            {
                importedHTML[currIndex] = ["text", htmlContent[i].split('span')[1].split('>')[1].split('<')[0]];
                currIndex += 1;
            }
            setHMTL(importedHTML);
            setNumLines(currIndex);
            setNumImages(imageNum);
            */