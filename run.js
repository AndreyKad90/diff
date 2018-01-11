const diff = require('./diff');

const filePaths = process.argv.slice(2);

if (!filePaths.length) {
    console.log('Usage: node run <baseFilePath> <newFile> [<newFile2> [<newFile3>]]');
    process.exit();
}

const [baseFile] = filePaths;
const newFiles = filePaths.slice(1);

diff.compareFiles(baseFile, newFiles)
    .then(renderResult)
    .catch(error => {
        console.log(error);
    });

function renderResult(result) {

    result.forEach(comparison => {
        const output = [];
       
        comparison.lines.forEach((line, index) => {
            const i = index + 1;
            switch(line.action) {
                case diff.CHANGED:
                    output.push(formLine(i, '*', `${line.baseLine}|${line.newLine}`));
                    break;
                case diff.REMOVED:
                    output.push(formLine(i, '-', line.baseLine));
                    break;
                case diff.ADDED:
                    output.push(formLine(i, '+', line.newLine));
                    break;
                case diff.UNTOUCHED:
                    output.push(formLine(i, ' ', line.baseLine));
                    break; 
            }  
       });

       console.log(`The changes between '${comparison.baseFilePath}' and '${comparison.newFilePath}':`);
       console.log(output.join('\n'), '\n')
    });

}

function formLine(index, changeSymbol, changeValue) {
    return [index, changeSymbol, changeValue].join('   ');
}