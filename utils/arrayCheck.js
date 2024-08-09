export function checkAndPush(elm, arr) {

    if (!(arr.includes(elm))) {
        arr.push(elm);
    } 
}

export function checkAndRemove(elm, arr) {

    console.log(arr);

    const i = arr.indexOf(elm);
    
    if (i !== -1) {
        arr.splice(i, 1);
    }
}