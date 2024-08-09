export function generateUserContent(
    username, 
    email = null, 
    fullName = null,
    location = null, 
    organization = null) {

        let contentElm = `<div class="username">${username}</div>`;

        contentElm += fullName? 
            `<div class="full-name">${fullName}</div>` : ``;

        contentElm += email?
            `<div class="e-mail">
                <a href="mailto:${email}" class="email-link">
                <i class="bi bi-envelope-at"></i>
                ${email}
                </a>
            </div>` : ``;
        
        contentElm += location? 
            `<div class="location">
                <i class="bi bi-geo-alt"></i>
                ${location}
            </div>` : ``;

        contentElm += organization? 
            `<div class="organization">
            <i class="bi bi-building"></i>
                ${organization}
            </div>` : ``;

        return contentElm;
}