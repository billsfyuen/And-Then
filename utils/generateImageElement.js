export function generateImageElement (imageName, username) {
    //if no profile image was uploaded, use default

	if (!imageName) {
		let defaultProfileImage = new ProfileImage(
			username, {
			backgroundColor: "black",
		})
		return defaultProfileImage.svg();
	} else {
		return `<img src="/profile-image/${imageName}" alt="">`
	}
}