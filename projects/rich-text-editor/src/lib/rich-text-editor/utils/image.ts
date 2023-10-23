export function loadImage(file: File | null, cbAfterLoad: (url: string) => void) {
    if (file && file.type.startsWith('image/')) {

        let reader = new FileReader();

        reader.onload = (function (theFile) {
            if (theFile == null || theFile === undefined)
                return;

            let dataURI = theFile.target?.result;

            if (dataURI) {
                cbAfterLoad(dataURI.toString());
            }

        });

        reader.readAsDataURL(file);
    }
}

