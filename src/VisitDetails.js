import React from 'reactn';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';
import ResourceService from './services';
import { capitalizeName, formatPhoneForDisplay, formatPostcode, formatPhoneForSave } from './formatters';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { OVERRIDE_DATE, getCurrentDate } from './CurrentDate';
import { activities } from './jeugddorp';
import { getFormData } from './utils';
import { isLocalhost } from './network';

class VisitDetails extends React.Component {

  pasteCount = 0;

  constructor(props) {
    super(props);
    const queryValues = queryString.parse(props.location.search);
    const params = props.match.params;
    const id = params.id;
    const isNew = id === undefined;
    this.state = {
      loading: false,
      message: 'Nieuw kind, nieuw bezoek',
      id,
      isNew,
      isAdmin: queryValues.admin === 'true' || isLocalhost(),
      person: {},
      visit: isNew ? {
        date: getCurrentDate(),
        name: capitalizeName(queryValues.name)
      } : {}
    }
      //$scope.message = "";

  }

  componentDidMount() {
    if (!this.state.isNew) {
      this.fetchPerson();
    }
  }

  async fetchPerson() {
    this.setState({ loading: true, message: '' });
    const id = this.state.id;
    const date = getCurrentDate();
    let [person, visits] = await Promise.all([
      ResourceService.getItem('kinderen', id),
      ResourceService.getItems('bezoeken', { kind: id, date })
    ]);
    let visit = null;
    if (visits.length > 0) {
      visit = visits[0]; //TODO: move to convenience function
    }
    let message = '';
    if (visit === null && person !== null) {
      // Create default visit (copy from person)
      visit = {
        date,
        kind: id,
        name: person.name,
        phone1: person.phone1,
        phone2: person.phone2,
        phone3: person.phone3,
        activity1: person.activity1,
        activity2: person.activity2,
        remarks: person.remarks
      };
      message = "Nieuw bezoek voor " + person.name;
    }
    else {
      if (person === null) {
        // This should not occur
        this.setState({
          person: {},
          visit: {},
          error: "Kon geen kind vinden voor id " + id,
          loading: false
        })
        return;
      }
      if (visit !== null) {
        message = "Bestaand bezoek bewerken voor " + visit.name;
      }
    }

    // Format
    visit.name = capitalizeName(visit.name);
    visit.phone1 = formatPhoneForDisplay(visit.phone1);
    visit.phone2 = formatPhoneForDisplay(visit.phone2);
    visit.phone3 = formatPhoneForDisplay(visit.phone3);
    person.postcode = formatPostcode(person.postcode);
    
    this.setState({
      person,
      visit,
      error: '',
      message,
      loading: false
    });
  }

  handleTextChange(e) {
    this.setState({ filter: e.target.value },
      this.debounceSearch);
  }

  updateFromFormData(data) {

    // Update visit, formatting the form data
    const { visit, person } = this.state;
    visit.name = capitalizeName(data.name);
    visit.phone1 = formatPhoneForSave(data.phone1);
    visit.phone2 = formatPhoneForSave(data.phone2);
    visit.phone3 = formatPhoneForSave(data.phone3);
    visit.remarks = data.remarks;
    visit.activity1 = data.activity1;
    visit.activity2 = data.activity2;

    // Update person from visit
    person.name = visit.name;
    person.phone1 = visit.phone1;
    person.phone2 = visit.phone2;
    person.phone3 = visit.phone3;
    person.remarks = visit.remarks;
    person.activity1 = visit.activity1;
    person.activity2 = visit.activity2;
    person.postcode = formatPostcode(data.postcode);
    person.email = data.email;

    return { person, visit };
  }

  async onFormSubmit(e) {
    e.preventDefault();
    this.savePersonVisit(true);
  }

  async savePersonVisit(doSaveVisit=true) {
    const formElement = document.getElementById("personVisitForm");
    const data = getFormData(formElement);
    const { person, visit } = this.updateFromFormData(data);

    if (person.name === '') {
      this.setState({error: "Vul een naam in"});
      return;
    }

    // Keep a reference to the previous person
    this.setGlobal({ 'previousPerson': person });

    // First save person, because we need the id if it's new
    try {
      const personID = await ResourceService.saveItem('kinderen', person);
      visit.kind = personID;
      if (doSaveVisit) {
        await ResourceService.saveItem('bezoeken', visit);
      }

      this.navigateToSearchPage(visit);
    }
    catch(error) {
      this.setState({errorMessage: error});
    }
  }

  cancelPersonVisit() {
    this.setGlobal({ 'previousPerson': this.state.person });
    this.navigateToSearchPage(this.state.visit);
  }

  navigateToSearchPage(matchVisit) {
      // Open search page with current phone and name to look for probable matches
      const matchPhone = formatPhoneForSave(matchVisit.phone1);
      const url = `/?matchphone=${matchPhone}&matchname=${matchVisit.name}`;
      this.props.history.push(url);
  }

  copyFromPreviousPerson() {
    const formElement = document.getElementById("personVisitForm");
    const data = getFormData(formElement);
    const { person, visit } = this.updateFromFormData(data);
    const { previousPerson } = this.global;
    if (!previousPerson) {
      return;
    }

    // Copy last name if it is not present on the new person.
    // We assume everything after first word is the last name.
    var splitNameCurrent = visit.name.split(" ");
    if (visit.name && splitNameCurrent.length === 1) {
      var splitNamePrevious = previousPerson.name.split(" ");
      if (splitNamePrevious.length > 1) {
        visit.name = splitNameCurrent[0] + " " + splitNamePrevious.slice(1).join(" ");
      }
    }

    // Literally copy other properties
    visit.phone1 = previousPerson.phone1;
    visit.phone2 = previousPerson.phone2;
    visit.phone3 = previousPerson.phone3;
    visit.remarks = previousPerson.remarks;
    person.email = previousPerson.email;
    person.postcode = previousPerson.postcode;
    visit.activity1 = previousPerson.activity1;
    visit.activity2 = previousPerson.activity2;

    this.setState({ person, visit: {...visit} });
    this.forceUpdate();
  }

  render () {
    const { loading, error, message, visit, person, isAdmin } = this.state;
    const phonePattern = /(^\+[0-9]{2}|^\+[0-9]{2}\(0\)|^\(\+[0-9]{2}\)\(0\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\-\s]{10}$)/.source;
    const postcodePattern = /^[1-9]\d{3}\s?[a-zA-Z]{2}(\s?\d+(\S+)?)?$/.source;
    //const emailPattern = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.source;
    const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.source;
    return (
      <div className={ OVERRIDE_DATE ? 'override-date' : '' }>
        <div className="offset-sm-2 col-sm-10">
          { message && <div className="alert"><strong>{message}</strong></div> }
          { loading &&  <div className="alert alert-info"><span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
            <span> Loading...</span></div> }
          { error && <div className="alert alert-danger"><strong>{error}</strong></div> }
        </div>

        { !loading &&
          <form className="form-horizontal" id="personVisitForm"
            autoComplete="off" noValidate
            onSubmit={this.onFormSubmit.bind(this)}>

            <div className="col-sm-12">
              { isAdmin && <FormInput name="date" label="Datum:" value={ visit.date } /> }
              <FormInput name="name" label="Naam:" value={ visit.name } requiredMessage="Voer naam in" />
              <FormInput name="phone1" label="Telefoon 1:" value={ visit.phone1 } pattern={ phonePattern } requiredMessage="Voer minstens 1 telefoonnummer in" patternMessage="Ongeldig telefoonnummer" />
              <FormInput name="phone2" label="Telefoon 2:" value={ visit.phone2 } pattern={ phonePattern } patternMessage="Ongeldig telefoonnummer" />
              <FormInput name="phone3" label="Telefoon 3:" value={ visit.phone3 } pattern={ phonePattern } patternMessage="Ongeldig telefoonnummer" />
              <FormInput name="remarks" label="Opmerkingen:" value={ visit.remarks } />
              <FormInput name="email" label="Email:" value={ person.email } pattern={ emailPattern } patternMessage="Ongeldig emailadres" />
              <FormInput name="postcode" label="Postcode:" value={ person.postcode } patternMessage="Ongeldige postcode" pattern={ postcodePattern } />
              <FormSelect name="activity1" label="Onderdeel ochtend:" value={ visit.activity1 } options={ activities } />
              <FormSelect name="activity2" label="Onderdeel middag:" value={ visit.activity2 } options={ activities } />
            </div>

            <div className="offset-md-2 col-sm-12 form-group">
              <button type="submit" className="btn btn-primary btn-lg">Bezoek opslaan</button>
              { isAdmin && <button type="button" className="btn btn-primary btn-lg" onClick={this.savePersonVisit.bind(this, false)}>Alleen kind opslaan</button> }
              <button type="button" className="btn btn-secondary btn-lg" onClick={this.cancelPersonVisit.bind(this)}>Annuleren</button>
              <button type="button" className="btn btn-secondary btn-lg" disabled={!this.global.previousPerson} onClick={this.copyFromPreviousPerson.bind(this)}>Kopieer van vorig kind</button>
            </div>

          </form>
        }
      </div>
    );
  }
}

export default withRouter(VisitDetails);
