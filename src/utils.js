
export function getFormDataFromEvent(event) {
  event.preventDefault();
  return getFormData(event.target);
}

export function getFormData(formElement) {
  const formData = new FormData(formElement);
  const data = {};
  formData.forEach((value, key) => { data[key] = value });
  return data;
}
