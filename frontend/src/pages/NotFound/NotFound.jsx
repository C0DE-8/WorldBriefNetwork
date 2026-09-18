import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import s from './NotFound.module.css'

export default function NotFound() {
  return <section className={s.page}>
    <div className={s.number} aria-hidden="true">404</div>
    <div className={s.content}>
      <span>PAGE NOT FOUND</span>
      <h1>A little off<br />the map.</h1>
      <p>The page you’re looking for may have moved, changed its address, or no longer exists.</p>
      <div className={s.actions}>
        <Link className="darkButton" to="/">Back to the front page <Icon name="arrow" size={15} /></Link>
        <Link to="/search">Search our stories <Icon name="right" size={14} /></Link>
      </div>
    </div>
    <aside className={s.note}>
      <span>WHERE TO NEXT?</span>
      <Link to="/trending">See what’s trending <Icon name="arrow" size={13} /></Link>
      <Link to="/category/world">Explore world stories <Icon name="arrow" size={13} /></Link>
      <Link to="/category/technology">Visit technology <Icon name="arrow" size={13} /></Link>
    </aside>
  </section>
}
