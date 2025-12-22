from fastapi import APIRouter, HTTPException
from app.models.team import Team
from app.models.guild import Guild
from app.database import SessionLocal

router = APIRouter()

@router.post("/guilds/{guild_id}/teams", response_model=Team)
async def create_team(guild_id: int, team: Team):
    db = SessionLocal()
    guild = db.query(Guild).filter(Guild.id == guild_id).first()
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    db.add(team)
    db.commit()
    db.refresh(team)
    return team

@router.get("/guilds/{guild_id}/teams", response_model=list[Team])
async def get_teams(guild_id: int):
    db = SessionLocal()
    teams = db.query(Team).filter(Team.guild_id == guild_id).all()
    return teams

@router.get("/guilds/{guild_id}/teams/{team_id}", response_model=Team)
async def get_team(guild_id: int, team_id: int):
    db = SessionLocal()
    team = db.query(Team).filter(Team.id == team_id, Team.guild_id == guild_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.put("/guilds/{guild_id}/teams/{team_id}", response_model=Team)
async def update_team(guild_id: int, team_id: int, team: Team):
    db = SessionLocal()
    existing_team = db.query(Team).filter(Team.id == team_id, Team.guild_id == guild_id).first()
    if not existing_team:
        raise HTTPException(status_code=404, detail="Team not found")
    existing_team.name = team.name
    db.commit()
    db.refresh(existing_team)
    return existing_team

@router.delete("/guilds/{guild_id}/teams/{team_id}")
async def delete_team(guild_id: int, team_id: int):
    db = SessionLocal()
    team = db.query(Team).filter(Team.id == team_id, Team.guild_id == guild_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return {"detail": "Team deleted"}