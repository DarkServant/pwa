
class DataReader {
    constructor(data) {
        this.data = data;

    }

    paddy(n, p, c = '0') {
        return ('' + n).padStart(p, c)
    }

    async readFile(filePath) {
        try {
            return new Promise((resolve) => {
                let vm = this;
                let xhr = new XMLHttpRequest();
                xhr.open('GET', filePath, true);
                xhr.responseType = 'arraybuffer';

                xhr.onload = function(e) {
                    let buffer = new Uint8Array(this.response);
                    resolve({ buffer: buffer, currPos: 0 });
                };

                xhr.send();
            });
        } catch (error) {
            console.log(`dataReader.readFile Error: ${error}`);
        }
    }

    readUInt32() {
        let buffer = this.data;
        let t1 = (buffer.buffer[buffer.currPos] & 0xFF); //these four lines convert a 4 byte value to an int
        t1 += (buffer.buffer[buffer.currPos + 1] & 0xFF) << 0x08;
        t1 += (buffer.buffer[buffer.currPos + 2] & 0xFF) << 0x10;
        t1 += (buffer.buffer[buffer.currPos + 3] & 0xFF) << 0x18;

        buffer.currPos += 4;
        return t1;
    }

    readInt32() {
        let buffer = this.data;
        let t1 = (buffer[buffer.currPos] & 0xFF);
        t1 += (buffer[buffer.currPos + 1] & 0xFF) << 0x08;
        t1 += (buffer[buffer.currPos + 2] & 0xFF) << 0x10;
        t1 += (buffer[buffer.currPos + 3] & 0xFF) << 0x18;

        buffer.currPos += 4;

        t1 = ((t1 << 32) >> 32);

        return t1;
    }

    readUInt32NoShift() {
        let buffer = this.data;
        let t1 = (buffer.buffer[buffer.currPos] & 0xFF); //these four lines convert a 4 byte value to an int
        t1 += (buffer.buffer[buffer.currPos + 1] & 0xFF) << 0x08;
        t1 += (buffer.buffer[buffer.currPos + 2] & 0xFF) << 0x10;
        t1 += (buffer.buffer[buffer.currPos + 3] & 0xFF) << 0x18;

        //buffer.currPos += 4;
        return t1;
    }

    readByte() {
        let buffer = this.data;

        let ret = buffer.buffer[buffer.currPos];
        buffer.currPos++;
        return ret;
    }

    readByteNoShift() {
        let buffer = this.data;

        let ret = buffer.buffer[buffer.currPos]
        return ret;
    }

    //I have no idea why this function works for reading the ctf message length when the first byte is equal to 255 but it does.
    readMarcosHack() {
        let buffer = this.data;
        let t1 = (buffer.buffer[buffer.currPos] & 0xFF) << 0x01;//these four lines convert a 2 byte value to an int
        t1 += (buffer.buffer[buffer.currPos + 1] & 0xFF);
        buffer.currPos += 2;

        return t1 + 3;
    }
    readUInt16() { //may not be ushort...
        let buffer = this.data;
        //convert buffer to uint16
        let t1 = (buffer.buffer[buffer.currPos] & 0xFF);
        t1 += (buffer.buffer[buffer.currPos + 1] & 0xFF) << 0x08;

        buffer.currPos += 2;

        //convert uint16 to int16
        //t1 = ((t1 << 16) >> 16);
        return t1;

    }

    readUShort() { //may not be ushort...
        let buffer = this.data;
        //convert buffer to uint16
        let t1 = (buffer.buffer[buffer.currPos] & 0xFF);
        t1 += (buffer.buffer[buffer.currPos + 1] & 0xFF) << 0x08;

        buffer.currPos += 2;

        //convert uint16 to int16
        //t1 = ((t1 << 16) >> 16);
        return t1;

    }

    readFixedString(length) {
        let buffer = this.data;
        let ret = '';
        for (let i = 0; i < length; i++) {
            ret = ret + String.fromCharCode(buffer.buffer[buffer.currPos]) + '';
            buffer.currPos++;
        }
        return ret;
    }

    readString() {
        let buffer = this.data;
        let ret = '';

        while (true) { // eslint-disable-line 
            if (buffer.buffer[buffer.currPos] === 0) {
                //console.log('0 found at cursorpos: ' + buffer.currPos);
                buffer.currPos++;
                break;
            }
            ret = ret + String.fromCharCode(buffer.buffer[buffer.currPos]) + '';
            buffer.currPos++;
        }
        return ret;
    }
}

export {DataReader};