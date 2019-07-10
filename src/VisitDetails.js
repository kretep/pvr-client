import React from 'reactn';
import queryString from 'query-string';
import { withRouter, Link } from 'react-router-dom';
import ResourceService from './services';
import { capitalizeName, formatPostcode, formatPhoneForSave, filterPhone } from './formatters';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { OVERRIDE_DATE, getCurrentDate, getNow } from './CurrentDate';
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
      saving: false,
      savingPerson: false,
      message: 'Nieuw kind, nieuw bezoek',
      error: '',
      id,
      isNew,
      isAdmin: queryValues.admin === 'true' || isLocalhost(),
      person: {},
      visit: isNew ? { // Create default visit for new person
        date: getCurrentDate(),
        created: getNow(),
        name: capitalizeName(queryValues.name)
      } : {}
    }
    this.isActivityChanged = false;
  }

  componentDidMount() {
    if (!this.state.isNew) {
      this.fetchPerson();
    }
  }

  async fetchPerson() {
    this.setState({ loading: true, message: '' });
    const personID = this.state.id;
    const date = getCurrentDate();
    let person = {}, visits = [];
    try {
      [person, visits] = await Promise.all([
        ResourceService.getItem('kinderen', personID),
        ResourceService.getItems('bezoeken', { kind: personID, date })
      ]);
    }
    catch(error) {
      this.setState({ error: `Fout bij ophalen van het kind of bezoek; probeer het opnieuw. Details: ${error}`,
       loading: false, person: {}, visit: {} });
      return;
    }
    let visit = null;
    if (visits.length > 0) {
      visit = visits[0]; //TODO: move to convenience function
    }
    let message = '';
    if (visit === null && person !== null) {
      // Create default visit for existing person
      visit = {
        date,
        created: getNow(),
        kind: personID,
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
          error: "Kon geen kind vinden voor id " + personID,
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
    visit.phone1 = formatPhoneForSave(visit.phone1);
    visit.phone2 = formatPhoneForSave(visit.phone2);
    visit.phone3 = formatPhoneForSave(visit.phone3);
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

  onActivityChange(e) {
    if (this.isActivityChanged) {
      // Only copy the activity if it hasn't been changed before
      return;
    }
    const { visit } = this.getPersonVisitFromForm();
    visit.activity2 = visit.activity1
    this.setState({ visit });
    this.isActivityChanged = true;
  }

  getPersonVisitFromForm() {
    const formElement = document.getElementById("personVisitForm");
    const data = getFormData(formElement);

    // Update visit, formatting the form data
    const { visit, person } = this.state;
    if (data.date) { // only applies for admin
      visit.date = data.date;
    }
    visit.lastupdated = new Date().toISOString();
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
    if (doSaveVisit) {
      this.setState({ saving: true });
    }
    else {
      this.setState({ savingPerson: true });
    }
    const { person, visit } = this.getPersonVisitFromForm();

    if (person.name === '') {
      this.setState({error: "Vul een naam in", saving: false, savingPerson: false});
      return;
    }

    // First save person, because we need the id if it's new
    try {
      const personID = await ResourceService.saveItem('kinderen', person);
      visit.kind = personID;
      if (doSaveVisit) {
        await ResourceService.saveItem('bezoeken', visit);
      }

      // Keep a reference to the previous person
      this.setGlobal({ 'previousPerson': person });

      this.navigateToSearchPage(visit);
    }
    catch(error) {
      this.setState({error: `Fout bij opslaan van kind of bezoek. Probeer het opnieuw. Details: ${error}`,
        saving: false, savingPerson: false});
    }
  }

  cancelPersonVisit() {
    const { person, visit } = this.getPersonVisitFromForm();
    if (person.name !== '') {
      this.setGlobal({ 'previousPerson': person });
    }
    this.navigateToSearchPage(visit);
  }

  navigateToSearchPage(matchVisit) {
      // Open search page with current phone and name to look for probable matches
      const matchPhone = formatPhoneForSave(matchVisit.phone1);
      const url = `/?matchphone=${matchPhone}&matchname=${matchVisit.name}`;
      this.props.history.push(url);
  }

  copyFromPreviousPerson() {
    const { person, visit } = this.getPersonVisitFromForm();
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

  onPaste(e) {
    const text = e.clipboardData.getData('Text');
    const split = text.split('\t');
    if (split.length >= 11) { //remarks is optional, length can vary
      const { visit, person } = this.state;
      visit.name = split[this.pasteCount + 1];
      visit.phone1 = filterPhone(split[6]);
      visit.phone2 = filterPhone(split[7]);
      visit.phone3 = filterPhone(split[8]);
      if (split.length >= 12) {
        visit.remarks = split[11];
      }
      person.email = split[10];
      person.postcode = formatPostcode(split[9]);
      this.setState({ visit, person });

      // Prevent actual paste
      e.preventDefault();
      this.pasteCount = this.pasteCount < 4 ? this.pasteCount + 1 : 0;
    }
  }

  render () {
    const { loading, saving, savingPerson, error, message, visit, person, isAdmin, isNew } = this.state;
    const { previousPerson } = this.global;
    const isLoadedSuccess = Object.keys(visit).length > 0;
    const phonePattern = /(^\+[0-9]{2}|^\+[0-9]{2}\(0\)|^\(\+[0-9]{2}\)\(0\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\-\s]{10}$)/.source;
    const postcodePattern = /^[1-9]\d{3}\s?[a-zA-Z]{2}(\s?\d+(\S+)?)?$/.source;
    const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.source;
    return (
      <div className={ OVERRIDE_DATE ? 'override-date' : '' }>
        <div className="col-sm-12">
          { message && <div className="alert"><strong>{message}</strong></div> }
          { loading &&  <div className="alert alert-info">
            <span className="spinner-grow" role="status" aria-hidden="true"></span>
            <span> Laden...</span>
          </div> }
          { error && <div className="alert alert-danger"><strong>{error}</strong></div> }
        </div>

        { !loading && !isLoadedSuccess &&
          <div className="col-sm-12 form-group no-print">
            <Link to="/" className="float-left">Terug naar zoeken</Link>
        </div> }

        { !loading && isLoadedSuccess &&
          <form className="form-horizontal" id="personVisitForm"
            autoComplete="off" noValidate
            onSubmit={this.onFormSubmit.bind(this)}>

            { isNew && previousPerson && previousPerson.name !== '' && <div className="offset-sm-3 col-sm-9 form-group">
              <button type="button" className="btn btn-secondary btn-lg" 
              onClick={this.copyFromPreviousPerson.bind(this)}>Kopieer van {previousPerson.name}</button>
            </div> }

            <div className="col-sm-12">
              { isAdmin && <FormInput name="date" type="date" label="Datum:" value={ visit.date } /> }
              <FormInput name="name" type="text" label="Naam:" value={ visit.name } requiredMessage="Voer naam in" onPaste={this.onPaste.bind(this)} />
              <FormInput name="phone1" type="tel" label="Tel. 1:" value={ visit.phone1 } pattern={ phonePattern } requiredMessage="Voer minstens 1 telefoonnummer in" patternMessage="Ongeldig telefoonnummer" />
              <FormInput name="phone2" type="tel" label="Tel. 2:" value={ visit.phone2 } pattern={ phonePattern } patternMessage="Ongeldig telefoonnummer" />
              <FormInput name="phone3" type="tel" label="Tel. 3:" value={ visit.phone3 } pattern={ phonePattern } patternMessage="Ongeldig telefoonnummer" />
              <FormInput name="remarks" type="text" label="Opmerkingen:" value={ visit.remarks } />
              <FormSelect name="activity1" label="Ochtend:" value={ visit.activity1 } options={ activities } onChange={ this.onActivityChange.bind(this) } />
              <FormSelect name="activity2" label="Middag:" value={ visit.activity2 } options={ activities } />
              <FormInput name="email" type="email" label="Email:" value={ person.email } pattern={ emailPattern } patternMessage="Ongeldig emailadres" />
              <FormInput name="postcode" type="text" label="Postcode:" value={ person.postcode } patternMessage="Ongeldige postcode" pattern={ postcodePattern } />
            </div>

            <div className="col-sm-12 form-group">
              <div className="float-right">
                <button type="button" className="btn btn-secondary btn-lg" onClick={this.cancelPersonVisit.bind(this)}>Annuleren</button>
                <button type="submit" className="btn btn-primary btn-lg">
                  { saving && <span className="spinner-grow" role="status" aria-hidden="true"></span> }
                  Bezoek opslaan</button>
                { isAdmin && <button type="button" className="btn btn-primary btn-lg" onClick={this.savePersonVisit.bind(this, false)}>
                  { savingPerson && <span className="spinner-grow" role="status" aria-hidden="true"></span> }
                  Alleen kind opslaan</button> }
              </div>
            </div>

          </form>
        }
      </div>
    );
  }
}

export default withRouter(VisitDetails);
