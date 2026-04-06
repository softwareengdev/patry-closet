using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatryCloset.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSocialLoginFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppleId",
                schema: "patrycloset",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                schema: "patrycloset",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LoginProvider",
                schema: "patrycloset",
                table: "AspNetUsers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppleId",
                schema: "patrycloset",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                schema: "patrycloset",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LoginProvider",
                schema: "patrycloset",
                table: "AspNetUsers");
        }
    }
}
