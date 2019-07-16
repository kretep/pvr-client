import * as React from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import dateFormat from 'dateformat';
import ResourceService from './ResourceService';
import { OVERRIDE_DATE, getCurrentDate } from './CurrentDate';
import { getFormData, getFormDataFromEvent } from './utils';
import { activities, getShortActivities } from './activities';
import { isLocalhost } from './network';

export default class Visits extends React.Component {

  constructor(props) {
    super(props);
    const queryValues = queryString.parse(props.location.search);
    this.state = {
      loading: true,
      error: '',
      date: getCurrentDate(),
      search: '',
      activity: '',
      visits: [],
      isAdmin: queryValues.admin === 'true' || isLocalhost()
    }
    this.removeVisit = this.removeVisit.bind(this);
  }

  componentDidMount() {
    this.fetchVisits(this.state);
  }

  async fetchVisits({date, search, activity}) {
    this.setState({ loading: true, visits: [] });
    const filter = {
      date
    }
    if (search) {
      filter.name = {
          $regex: search,
          $options: 'i'
      }
    }
    if (activity && activity !== 'all') {
      filter.$or = [
        { activity1: activity },
        { activity2: activity }
      ]
    }
    try {
      const visits = await ResourceService.getItems('bezoeken', filter);
      this.setState({ loading: false, visits });
    }
    catch(error) {
      this.setState({ error: `Fout bij het zoeken; probeer het opnieuw. 
        Details: ${error}`, loading: false });
      return;
    }
  }

  search(e) {
    const data = getFormDataFromEvent(e);
    this.search3(data);
  }

  search2() {
    const formElement = document.getElementById("filterVisitsForm");
    const data = getFormData(formElement);
    this.search3(data);
  }

  search3(data) {
    const { date, search, activity } = data;
    this.setState({ date, search, activity });
    this.fetchVisits(data);
  }

  async removeVisit(visit) {
    const { visits } = this.state;
    if (window.confirm(`Bezoek verwijderen voor ${visit.name}?`)) {
      try {
        await ResourceService.deleteItem('bezoeken', visit);
        const index = visits.indexOf(visit);
        visits.splice(index, 1);
        this.setState({ visits });
      }
      catch(error) {
        this.setState({ error: `Fout bij verwijderen; probeer het opnieuw. 
          Details: ${error}`, loading: false });
        return;
      }
    }
  }

  render () {
    const { loading, error, visits, date, search, activity, isAdmin } = this.state;
    const formattedDate = dateFormat(Date.parse(date), 'dddd d mmmm yyyy');
    return (
    <div className={ OVERRIDE_DATE ? 'override-date' : '' }>
      { isAdmin && <div className="col-sm-12 form-group">
        <form id="filterVisitsForm" className="form-inline no-print" noValidate onSubmit={this.search.bind(this)}>
          <label className="control-label" htmlFor="date">Filter:</label>
          <input type="date" className="form-control input-lg" name="date" defaultValue={date} onChange={this.search2.bind(this)} />
          <input type="text" className="form-control input-lg" name="search" placeholder="naam..." />
          <select className="form-control input-lg" name="activity" onChange={this.search2.bind(this)}>
            <option key="all" value="all">Alles</option>
            { activities.map(activity => (
              <option key={activity.value} value={activity.value}>{activity.label}</option>
            ))}
          </select>
          <button className="btn btn-lg btn-primary" type="submit">Zoeken</button>
        </form>
      </div> }

      { !isAdmin && <div className="col-sm-12 form-group no-print">
          <Link to="/" className="float-left">Terug naar zoeken</Link><br />
      </div> }
    
      <div className="col-sm-12">
        { loading &&  <div className="alert alert-info">
          <span className="spinner-grow" role="status" aria-hidden="true"></span>
          <span> Laden...</span>
        </div> }
        { error && <div className="alert alert-danger"><strong>{error}</strong></div> }
      </div>

      { !loading && visits !== undefined && <div>
        <div className="col-sm-12">
          <p>Inschrijvingen voor { formattedDate }
            { search && <span>, "{ search }"</span> }
            { activity && <span>, { activity }</span> }
            &nbsp;({ visits.length })
          </p>
        </div>
    
        <div className="col-sm-12 form-group">
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>#</th>
                { isAdmin && <th>&times;</th> }
                <th>Naam</th>
                <th>Tel. 1</th>
                <th>Tel. 2</th>
                <th>Tel. 3</th>
                <th>Ond.</th>
                <th>Opmerkingen</th>
              </tr>
            </thead>
            <tbody>
              { visits.map((visit, index) => {
                const shortActivities = getShortActivities(visit.activity1, visit.activity2);
                return (
                <tr key={ visit._id.$oid }>
                  <td className="fixed">{ index + 1 }</td>
                  { isAdmin && <td className="fixed"><button type="button" className="close"
                    onClick={() => {this.removeVisit(visit)}}>
                    <span>&times;</span></button></td> }
                  <td className="fixed">
                    <Link to={"visit/" + visit.kind}>{visit.name}</Link></td>
                  <td className="fixed">{ visit.phone1 }</td>
                  <td className="fixed">{ visit.phone2 }</td>
                  <td className="fixed">{ visit.phone3 }</td>
                  <td className="fixed">{ shortActivities }</td>
                  <td>{ visit.remarks }</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div> }

      <div className="col-sm-12 form-group no-print">
          <Link to="/" className="float-left">Terug naar zoeken</Link>
      </div>
    </div>
    );
  }
}
