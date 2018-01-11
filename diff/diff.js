const fs = require('./fs.promise');
const diffConstants = require('./diff.constants');

module.exports = {
    compareFiles
};

function compareFiles(baseFilePath, newFilesPaths) {
    return Promise.all(
        fs.readFiles([baseFilePath, ...newFilesPaths])
    ).then(([baseFile, ...newFiles]) => {
        baseFile = baseFile.toString();

        const allComparisons = newFiles.map((newFile, index) => {
            return compareTwoFiles(
                baseFile, 
                newFile.toString(), 
                baseFilePath, 
                newFilesPaths[index]
            );      
        });
        
        return Promise.all(allComparisons);
    });
}

function compareTwoFiles(baseFile, newFile, baseFilePath, newFilePath) {
    const baseLines = breakIntoLinesAndTrim(baseFile);
    const newLines = breakIntoLinesAndTrim(newFile);

    alignLines(baseLines, newLines);
    const diffs = determineDiffs(baseLines, newLines);
    return Promise.resolve({
        lines: diffs,
        baseFilePath,
        newFilePath
    });
}

/* 
    The loop iterates over the base file lines and 'aligns' the two arrays based on the lines. For example,
        (baseFile)     (newFile)
        Some            Another                     Some        Another
        Simple          Text                        Simple      
        Text            Document         =>         Text        Text
        File            File                                    Document
                        With                        File        File
                        Fields                                  With
                                                                Fields                                                            
*/
function alignLines(baseLines, newLines) {
    // a value used to ensure that if the newLines array is expanded, the values that are below
    // the expansion are not taken into account anymore
    let lastNewLinesWideningIndex = 0;

    for (let baseLineIndex = 0; baseLineIndex < baseLines.length; baseLineIndex++) {
        const baseLine = baseLines[baseLineIndex];
        const baseLineNewIndex = newLines.indexOf(baseLine);
      
        if (baseLineNewIndex !== -1 && baseLineNewIndex >= lastNewLinesWideningIndex) {
    
            if (baseLineNewIndex < baseLineIndex) {
                fillWithGaps.call(newLines, baseLineNewIndex, baseLineIndex - baseLineNewIndex);
                lastNewLinesWideningIndex = baseLineNewIndex + 1;
            } else if (baseLineNewIndex > baseLineIndex) {
                const gaps = baseLineNewIndex - baseLineIndex;
                fillWithGaps.call(baseLines, baseLineIndex, gaps);   
                lastNewLinesWideningIndex = baseLineNewIndex + 1;
                // increase the index by the number of gaps so that no iterations over 'gap' elements are done
                baseLineIndex += gaps;
            }
        }
    }
}

function determineDiffs(baseLines, newLines) {
    const diffs = [];
    const numberOfLines = baseLines.length > newLines.length ? baseLines.length : newLines.length;

    for (let i = 0; i < numberOfLines; i++) {
        const baseLine = baseLines[i];
        const newLine = newLines[i];
        const diff = {};

        if (baseLine) {
            diff.baseLine = baseLine;
            if (newLine) {
                diff.action = baseLine === newLine ? diffConstants.UNTOUCHED : diffConstants.CHANGED;
                diff.newLine = newLine;
            } else {
                diff.action = diffConstants.REMOVED;
            }
        } else if (newLine) {
            diff.action = diffConstants.ADDED;
            diff.newLine = newLine;
        }

        diffs.push(diff);
    }

    return diffs;
}

function fillWithGaps(index, gapsNumber) {
    this.splice(index, 0, ...Array(gapsNumber).fill(''));
}

function breakIntoLinesAndTrim(str) {
    return str.split('\n').map(str => str.trim());
}

