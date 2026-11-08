#!/usr/bin/env python3
"""Export hero observations separately from public, card-free session totals."""
import argparse
import gzip
import json
from pathlib import Path


def pick(value, keys):
    return {key: value[key] for key in keys if key in value}


def export(run):
    manifest = json.loads((run / 'manifest.json').read_text())
    source = {'repo': 'ela57/pokerbot', 'commit': manifest['git_commit'], 'seed': 1000000, 'run': run.name}
    hands = {}
    with gzip.open(run / 'decisions.jsonl.gz', 'rt') as stream:
        for line in stream:
            decision = json.loads(line)
            if decision['seed'] != source['seed'] or decision['bot_label'] != 'hero':
                continue
            obs = decision['observation']
            if decision['seat'] != obs['my_seat'] or obs['actor_seat'] != obs['my_seat']:
                raise ValueError('Decision is not a hero observation')
            seats = {seat['anon_id']: seat['seat'] for seat in obs['seats']}
            observation = pick(obs, ['board', 'street', 'my_seat', 'button_seat', 'pot_total', 'small_blind', 'big_blind', 'level', 'players_remaining', 'to_call'])
            observation['hero_cards'] = obs['hole_cards']
            observation['seats'] = [pick(seat, ['seat', 'stack', 'bet_this_street', 'total_contributed', 'folded', 'all_in', 'active', 'position']) for seat in obs['seats']]
            observation['action_history'] = [{**pick(action, ['street', 'kind', 'amount']), 'seat': seats.get(action.get('seat_anon'))} for action in obs['action_history']]
            row = pick(decision, ['street', 'position', 'stack_bucket'])
            row['observation'] = observation
            row['legal_actions'] = pick(decision['legal_actions'], ['can_fold', 'can_check', 'can_call', 'call_amount', 'min_raise_to', 'max_raise_to'])
            for key in ['requested_action', 'applied_action']:
                row[key] = pick(decision[key], ['kind', 'amount'])
            row['diagnostics'] = pick(decision.get('diagnostics') or {}, ['reason', 'pot_odds'])
            hands.setdefault(decision['hand_number'], []).append(row)
    exported = []
    for number, decisions in sorted(hands.items()):
        flags = []
        if any(d['street'] == 'river' for d in decisions): flags.append('river decision')
        if any(any(s.get('all_in', False) for s in d['observation']['seats']) for d in decisions): flags.append('observed all-in')
        if any(d['street'] != 'preflop' and sum(s.get('active', False) for s in d['observation']['seats']) >= 3 for d in decisions): flags.append('multiway postflop')
        exported.append({'number': number, 'tags': flags, 'decisions': decisions})
    ranked = sorted(exported, key=lambda h: (10 * ('observed all-in' in h['tags']) + 4 * ('river decision' in h['tags']) + 2 * ('multiway postflop' in h['tags']), max(d['observation']['pot_total'] for d in h['decisions'])), reverse=True)
    featured = []
    for tag in ['observed all-in', 'river decision', 'multiway postflop']:
        candidate = next((h['number'] for h in ranked if tag in h['tags']), None)
        if candidate is not None and candidate not in featured: featured.append(candidate)
    for hand in ranked:
        if len(featured) >= 20: break
        if hand['number'] not in featured: featured.append(hand['number'])
    replay = {'source': source, 'view': 'Hero decision observations only; no full-hand board or showdown data.', 'featured': sorted(featured), 'hands': exported}
    session = []
    with gzip.open(run / 'hands.jsonl.gz', 'rt') as stream:
        for line in stream:
            hand = json.loads(line)
            if hand['seed'] != source['seed']: continue
            hero = hand['hero_seat']
            session.append({'number': hand['hand_number'], 'hero_start': hand['starting_stacks'][hero], 'hero_end': hand['ending_stacks'][hero], 'blinds': hand['blinds'], 'eliminations': hand['eliminations']})
    return replay, {'source': source, 'view': 'Public hand-boundary chip totals, blinds and elimination seat numbers only.', 'hands': session}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--out', type=Path, default=Path('prototypes/data'))
    args = parser.parse_args()
    replay, session = export(args.run)
    args.out.mkdir(parents=True, exist_ok=True)
    for name, data in [('poker-run.json', replay), ('poker-session.json', session)]:
        (args.out / name).write_text(json.dumps(data, separators=(',', ':')) + '\n')
        print(f'{name}: {len(data["hands"])} hands')
