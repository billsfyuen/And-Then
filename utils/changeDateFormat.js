export function changeDateFormat(dateString) {

    let parts = dateString.split("-");
    let year = parts[0];
    let month = parts[1];
    let day = parts[2];
    let formattedDate = `${day}/${month}/${year}`;

    return formattedDate;
}