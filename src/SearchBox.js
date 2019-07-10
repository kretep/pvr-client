import * as React from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import ResourceService from './services';
import { OVERRIDE_DATE } from './CurrentDate';

export default class SearchBox extends React.Component {

  constructor(props) {
    super(props);
    this.executeSearch = this.executeSearch.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.debounceSearch = AwesomeDebouncePromise(this.executeSearch, 300);

    const queryValues = queryString.parse(props.location.search);
    this.state = {
      loading: true,
      error: '',
      page: 1,
      pageSize: 10,
      searchText: '',
      matchName: queryValues.matchname,
      matchPhone: queryValues.matchphone,
      items: [],
      itemCount: 0,
      pageCount: 0,
    }
  }

  componentDidMount() {
    this.executeSearch();
  }

  async executeSearch() {
    this.setState({ loading: true, items: [], itemCount: 0, pageCount: 0 });
    const { searchText, matchPhone, page, pageSize } = this.state;
    const filter = {
      name: {
        $regex: searchText,
        $options: 'i'
      }
    }
    if (matchPhone) {
      filter.$or = [
        { phone1: matchPhone },
        { phone2: matchPhone },
        { phone3: matchPhone }
      ]
    }
    try {
      const results = await ResourceService.searchItems('kinderen', filter, page, pageSize);
      this.setState({ loading: false, ...results });
    }
    catch(error) {
      this.setState({ error: `Fout bij het zoeken; probeer het opnieuw. 
        Details: ${error}`, loading: false });
      return;
    }
  }

  handleTextChange(e) {
    this.setState({ 
        searchText: e.target.value,
        matchPhone: '',
        matchName: ''
      },
      this.debounceSearch
    );
  }

  previousPage() {
    this.setState((state) => {
      return state.page > 1 && { page: state.page - 1 };
    }, this.executeSearch)
  }

  nextPage() {
    this.setState((state) => {
      return state.page <  state.pageCount && { page: state.page + 1 };
    }, this.executeSearch)
  }

  showAll() {
    this.setState({matchPhone: '', matchName: ''},
      this.executeSearch);
  }

  render () {
    const { loading, error, page, pageSize, items, itemCount, searchText,
      matchPhone, matchName } = this.state;
    return (
      <div className={ OVERRIDE_DATE ? 'override-date' : '' }>
        <div className="col-sm-12 form-group">
          <form noValidate>
            <input type="text" className="form-control input-lg" placeholder="Kind zoeken" 
              onChange={this.handleTextChange} autoComplete="off" autoFocus />
          </form>
        </div>

        { error && <div className="alert alert-danger"><strong>{error}</strong></div> }

        { matchPhone && <div className="alert"><strong>Matches voor {matchName}</strong>
          <button className="btn btn-secondary btn-lg float-right"
            onClick={this.showAll.bind(this)}>Alles</button>
        </div> }

        <div className="col-sm-12 form-group">
          <button className="btn btn-secondary btn-lg" onClick={this.previousPage.bind(this)}>&lt;</button>
          <button className="btn btn-secondary btn-lg" onClick={this.nextPage.bind(this)}>&gt;</button>
          { loading && <span><span className="spinner-grow" role="status" aria-hidden="true"></span>
            <span> Laden...</span></span> }
          { !loading && items.length > 0 && <span>{(page - 1) * pageSize + 1} - {(page - 1) * pageSize + items.length} van { itemCount }</span> }
          { !loading && items.length === 0 && <span>Niets gevonden</span> }
          <Link to={"/visit/?name=" + searchText} className="btn btn-secondary btn-lg float-right" role="button">Nieuw kind</Link>
        </div>

        { !loading && <div className="col-sm-12 form-group">
          <div className="list-group">
            { items.map(item => (
              <Link to={ "/visit/" + item._id.$oid } className="list-group-item" key={ item._id.$oid }>{item.name}</Link>
            ))}
          </div>
        </div> }

        <div className="col-sm-12 form-group">
          <Link to={"/visit/?name=" + searchText} className="btn btn-secondary btn-lg float-right" role="button">Nieuw kind</Link>
        </div>

        <div className="col-sm-12 form-group">
          <Link to="/visits" className="float-left">Inschrijvingen vandaag</Link>
        </div>
      </div>
    );
  }
}
