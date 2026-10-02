from datetime import datetime,timezone
from app.main import score,safety,research_ready
def test_calendar_cannot_qualify():
    assert not score([{'family':'nager_date','calendar':True,'region':'Japan','terms':['festival']}])['eligible']
def test_duplicate_family_does_not_corroborate():
    recent=datetime.now(timezone.utc);rows=[{'family':'news_ap','calendar':False,'region':'US','terms':['music','festival'],'observed':recent} for _ in range(5)]
    assert not score(rows)['eligible']
def test_two_families_can_pass():
    t=datetime.now(timezone.utc);rows=[{'family':f,'calendar':False,'region':'US','terms':['music','festival'],'observed':t} for f in ['news_ap','wikimedia']]
    assert score(rows)['eligible']
def test_humor_is_weighted_but_does_not_replace_evidence_gates():
    t=datetime.now(timezone.utc);rows=[{'family':f,'calendar':False,'region':'US','terms':['music','festival'],'observed':t} for f in ['news_ap','wikimedia']]
    low=score(rows,humor=0);high=score(rows,humor=100)
    assert high['overall']-low['overall']==10
    assert low['eligible'] and high['eligible']
    assert not score(rows[:1],humor=100)['eligible']
def test_humor_research_starts_before_final_score_gate():
    t=datetime.now(timezone.utc);rows=[{'family':f,'calendar':False,'region':'Japan','terms':[],'observed':t,'event_title':'Festival'} for f in ['news_nhk','wikimedia']]
    preliminary=score(rows)
    assert not preliminary['eligible']
    assert research_ready(preliminary,2)
    assert not research_ready(score(rows[:1]),2)
def test_stale_signals_do_not_qualify():
    old=datetime.now(timezone.utc)-__import__('datetime').timedelta(days=5)
    rows=[{'family':f,'calendar':False,'region':'Japan','terms':['festival','music'],'observed':old} for f in ['news_nhk','wikimedia']]
    assert not score(rows)['eligible']
def test_disaster_fails_closed():
    assert safety('A major earthquake disrupts festival','A damaging earthquake happened during this public event.')[0]=='blocked'
def test_thin_candidate_held():
    assert safety('New thing','Short.')[0]=='held'
