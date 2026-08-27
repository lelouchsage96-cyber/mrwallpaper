-- Ad mediation stack (web waterfall + native SDK keys).

insert into app_settings (key, value) values
  ('ad_mediation', '[
    {"id":"adsense","enabled":true,"priority":1,"timeoutMs":2500,"ecpmFloor":2,"publisherId":"","sdkKey":"","bannerUnit":"","feedUnit":"","anchorUnit":"","rewardedUnit":""},
    {"id":"admob","enabled":false,"priority":2,"timeoutMs":3000,"ecpmFloor":4,"publisherId":"","sdkKey":"","bannerUnit":"","feedUnit":"","anchorUnit":"","rewardedUnit":""},
    {"id":"applovin_max","enabled":false,"priority":3,"timeoutMs":3000,"ecpmFloor":6,"publisherId":"","sdkKey":"","bannerUnit":"","feedUnit":"","anchorUnit":"","rewardedUnit":""},
    {"id":"levelplay","enabled":false,"priority":4,"timeoutMs":3000,"ecpmFloor":5,"publisherId":"","sdkKey":"","bannerUnit":"","feedUnit":"","anchorUnit":"","rewardedUnit":""},
    {"id":"meta","enabled":false,"priority":5,"timeoutMs":2500,"ecpmFloor":3,"publisherId":"","sdkKey":"","bannerUnit":"","feedUnit":"","anchorUnit":"","rewardedUnit":""},
    {"id":"house","enabled":true,"priority":99,"timeoutMs":0,"ecpmFloor":0,"publisherId":"","sdkKey":"","bannerUnit":"","feedUnit":"","anchorUnit":"","rewardedUnit":""}
  ]'::jsonb)
on conflict (key) do nothing;
