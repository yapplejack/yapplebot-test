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

//structure: doStuff, readInput, writeOutput, low level implement


//Revalations: currently our md export is not putting images in the correct locations or order. HMTL appears to always have the image in the ideal location. Text must be read in from HMTL to ensure correct image locations.
//MD must be rewritten to always have images in correct order as we still need to know the float location from the images.

//New style will be as follows: each line of HMTL is its own line in markdown, therefore we will basically be covnerting from markdown to HMTL, this will make debugging easier as the program will better reflect the file generated


//Current bugs: 
 
function Importerv2() {
    const [files, setFiles] = useState([]);
    const [importedHTML, setHMTL] = useState([]);
    const [importMD, setMD] = useState([]);
    const [numLines, setNumLines] = useState('');
    const [numImages,  setNumImages] = useState(0);
    const [doneSorting, setSorting] = useState(false);

    const [outputImages, setOutputImages] = useState([]);
    const [outputFiles, setOutputFiles] = useState([]);
    const [exportText, setExportText] = useState([]);
    
    const zip = require('jszip')();

    useEffect(() => {
        if(importMD != '' && files != '' && numImages == files.length - 2 && doneSorting == true){
            console.log("called");
            modifyFiles();
        }
    }, [importMD, files, numImages, doneSorting])

    const modifyImageTag = (index, imageIndex) => {
        //first start by finding the correct image in the hmtl (splitting could be more better but it works)
        outputImages[index] = files[parseInt(importedHTML[index][1].split("images/")[1].split('\"')[0].split('image')[1].split('\.jpg')[0])];
        setOutputImages(outputImages);

        let htmlText = importedHTML[index][1].split('<img')[1].split('\.jpg\" ')[1];
        let mdText = importMD[imageIndex].split('default\}')[0];
        return mdText + 'default\} ' + htmlText.split('\}\}')[0] + ', maxWidth: "none"\}\}' + htmlText.split('\}\}')[1];
    }

    const modifySpanTag = (index, imageIndex) => {
        console.log(importedHTML[index][1])
        let floatPosition = importedHTML[index][1].split('width')[0] + 'width' + importedHTML[index][1].split('width')[1].split('\}\}')[0];
        if(importMD[imageIndex].match(/left=\"-?(\d+)/i))
        {
            console.log(parseFloat(importMD[imageIndex].match(/left=\"-?(\d+)/i)[1]));
            if (parseFloat(importMD[imageIndex].match(/left=\"-?(\d+)/i)[1]) > 375)
            {
                floatPosition = importedHTML[index][1].split('width')[0] + 'float: \'right\', ' + 'width' + importedHTML[index][1].split('width')[1].split('\}\}')[0];
            }
            else{
                floatPosition = importedHTML[index][1].split('width')[0] + 'float: \'left\', ' + 'width' + importedHTML[index][1].split('width')[1].split('\}\}')[0];
            }
        }
        return floatPosition + "\}\}>"
    }

    const upscaleFromHMTL = () => {
        for(let i = 0; i < exportText.length; i++)
        {
            if(importedHTML[i][0] == 'img')
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
    }

    const createMarkdownFile = () => {
        let finalText = ""
        for(let i = 0; i < exportText.length; i++)
        {
            finalText += exportText[i] + "\n\n"
        }
        console.log(finalText);
    }

    const modifyFiles = () => {
        let imageIndex = 0;
        for(let i = 0; i < importedHTML.length; i++)
        {
            if(importedHTML[i][0] == 'img')
            {
                exportText[i] = modifyImageTag(i, imageIndex);
                exportText[i] = modifySpanTag(i, imageIndex) + exportText[i];
                imageIndex += 1;
            }
            else
            {
                exportText[i] = importedHTML[i][1];
            }
            setExportText(exportText);
        }
        console.log(exportText);
        upscaleFromHMTL();
        createMarkdownFile();
        //generateFiles();
    }

    const setupHTML = function (htmlContent) {
        htmlContent = htmlContent.split('</head>')[1].split('</p>');
        let numSpaces = 0;
        let currIndex = 0;
        let imageNum = 0;
        for(let i = 0; i < htmlContent.length - 1; i++)
        {
            let htmlP = htmlContent[i].split('</span>');
            console.log(htmlP);
            let textCollection = [];
            let textIndex = 0;
            let pBreak = false;
            for(let j = 0; j < htmlP.length; j++)
            {
                if(htmlP[j] != '')
                {
                    if(htmlP[j].match(/hr\sstyle=/i))
                    {
                        pBreak = true;
                    }
                    else if(htmlP[j].split('<span')[1].match(/\d\">$/) && !htmlP[j].split('span')[1].match(/style/i))
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
                    if(!htmlP[j].match(/hr\sstyle=/i) && htmlP[j].split('span')[1].match(/style/i))
                    {
                        if(textCollection.length > 0)
                        {
                            for(let j = 1; j < textCollection.length; j++)
                            {
                                textCollection[0] += textCollection[j];
                            }
                            importedHTML[currIndex] = ['text', textCollection[0]];
                            currIndex += 1;
                            textCollection.length = 0;
                        }
                        const reg = /-\webkit\-transform: 'rotate\(\d{1}\.\d{2}rad\) translateZ\(\d{1}px\)',/;
                        let res = htmlP[j].split('span style')[1].replaceAll(";", "',").replaceAll(": ", ": '").replaceAll('margin-left', 'marginLeft').replaceAll('margin-top', 'marginTop').replace(reg, "")
                        
                        .replaceAll('border: 0.00px solid #000000,', '').replace('="', "").replaceAll(", -webkit-transform: 'rotate(0.00rad) translateZ(0px)',", "").replace('px,"', "px").replace('>', '}}>').replace('">', "'}}>").replace("style=", "style={{ ")
                        .replace("px',\"", "px'").replace("\" title=\"'", "").replace("\"width", 'width');
                        res = "<span style={{" + res + "</img> </span>";
                        importedHTML[currIndex] = ["img", res];
                        currIndex += 1;
                        imageNum += 1;
                    }
                    else if(!htmlP[j].match(/hr\sstyle=/i) && htmlP[j].split('span')[1].match(/<\/a>/))
                    {
                        textCollection[textIndex] = '<a' + htmlP[j].split('<a')[1].split('<\/a>')[0] + '<\/a>';
                        textIndex += 1;
                    }
                    else if(!htmlP[j].match(/hr\sstyle=/i) && numSpaces == 0)
                    {
                        textCollection[textIndex] = htmlP[j].split('span')[1].split('>')[1];
                        textIndex += 1;
                    }
                    setHMTL(importedHTML);
                    setNumLines(currIndex);
                    setNumImages(imageNum);
                }
            }
            if(textCollection.length > 0)
            {
                for(let j = 1; j < textCollection.length; j++)
                {
                    textCollection[0] += textCollection[j];
                }
                importedHTML[currIndex] = ['text', textCollection[0]];
                currIndex += 1;
            }
            if(pBreak == true)
            {
                importedHTML[currIndex] = ["break", 'pageBreak'];
                currIndex += 1;
            }
        }
    }

    const setupMD = function (mdText)
    {
        mdText = mdText.split("\n").filter(function(e){return e})
        let i = 0;
        while(i < mdText.length && !mdText[i].match('<img src='))
        {
            i += 1;
            console.log(i);
        }
        let mdImages = []
        while(i < mdText.length)
        {
            mdImages.push(mdText[i]);
            i += 1;
        }
        
        setMD(mdImages);
    }

    const setupProgram = async (file) => {
        let mdText = await file[0].text();
        setFiles(file);
        let htmlContent = await file[file.length-1].text();
        setupHTML(htmlContent);
        setupMD(mdText);
        setSorting(true);
        //console.log(importedHTML);
    }

    const startImporting = async (file) => {
        console.log('in')
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

return (
    <div className="Importer">
        <center>
            <input multiple
                type="file"
                onChange={(e) => {
                    startImporting(e.target.files);
                }}
            />

        </center>
    </div>
);
}
 
export default Importerv2;